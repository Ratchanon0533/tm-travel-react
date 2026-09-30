/**
 * 3D map of Japan behind the hero (browser only — loaded lazily by Hero.jsx).
 * Coastline: src/data/japan-map.json (made by scripts/build-japan-map.mjs)
 * Elevation: src/data/japan-terrain.png (made by scripts/build-japan-terrain.mjs), see terrain.js
 * Pins: "coords" in src/data/destinations/*.json · routes start at the destination with "home": true
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute,
  MathUtils, QuadraticBezierCurve3, Vector3,
} from "three";
import map from "../../data/japan-map.json";
import { loadTerrain } from "./terrain.js";
import { cx } from "../../lib/cx.js";
import styles from "./JapanMap.module.css";

// Scene colors (brand navy & gold from tokens.css)
const GOLD = "#f8b62d";
const FOG = "#0a0e36";

// Land looks: `wall` = sides of the islands, `tints` = land colour by elevation (metres). Pick one with LAND_STYLE.
const LAND_STYLES = {
  // green plains → deep forest → bare rock above the tree line → snow on the highest peaks
  forest: { wall: "#5b4a36", tints: [[0, "#94b36c"], [300, "#62924f"], [900, "#3e6e42"], [1700, "#5f6f4f"], [2200, "#9a9483"], [2700, "#ffffff"]] },
  // warm sand on the coast → ivory uplands → snow
  sand: { wall: "#b8a27c", tints: [[0, "#cdb88f"], [400, "#dccdab"], [1100, "#ece3cd"], [1900, "#f7f3ea"], [2500, "#ffffff"]] },
};
const LAND_STYLE = "forest";
const WALL = LAND_STYLES[LAND_STYLE].wall;
const TINTS = LAND_STYLES[LAND_STYLE].tints.map(([m, c]) => [m, new Color(c)]);

const CENTER = { lng: 136.5, lat: 35.2 }; // middle of the map
const LNG_SCALE = Math.cos((CENTER.lat * Math.PI) / 180); // keeps the islands in proportion
const LAND_H = 0.32; // thickness of the islands at sea level
const RELIEF = 0.00025; // scene units per metre of elevation (≈28× exaggerated, so Mt. Fuji rises ~0.75)
const PIN_H = 1.05; // pin height above the ground

/** lng/lat → flat map position (x east, y north) */
const toPlane = (lng, lat) => [(lng - CENTER.lng) * LNG_SCALE, lat - CENTER.lat];
/** { lat, lng } → 3D position (the map lies flat; north points away from the camera) */
const toWorld = ({ lat, lng }, height = LAND_H) => {
  const [x, y] = toPlane(lng, lat);
  return new Vector3(x, height, -y);
};
/** Height of the ground above the sea for an elevation in metres */
const groundY = (metres) => LAND_H + metres * RELIEF;

function tint(metres, out) {
  let k = 1;
  while (k < TINTS.length - 1 && metres > TINTS[k][0]) k++;
  const [m0, c0] = TINTS[k - 1];
  const [m1, c1] = TINTS[k];
  return out.copy(c0).lerp(c1, MathUtils.clamp((metres - m0) / (m1 - m0), 0, 1));
}

/** Soft round glow, drawn once and shared by all pins */
function makeGlowTexture() {
  const canvas = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/**
 * The islands as a relief model: an elevation surface (a vertex on every `detail`-th grid point of the
 * height map, cut to the exact coastline by a mask), sides down to the sea, and a thin gold outline.
 */
function buildLand(terrain, detail) {
  const { west, north, step, width: W, height: H, metres, at } = terrain;
  const east = west + (W - 1) * step;
  const south = north - (H - 1) * step;
  const closed = (ring) => ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1];
  const rings = map.islands.map((ring) => (closed(ring) ? ring.slice(0, -1) : ring));

  // Coastline masks (white = land): a large one cuts the surface to the coast; a grid-sized one,
  // fattened by `grow` pixels, picks the grid cells worth building
  const drawMask = (w, h, sx, sy, grow) => {
    const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const off = grow ? 0.5 : 0; // in the grid-sized mask each pixel centre is a grid point
    ctx.fillStyle = ctx.strokeStyle = "#fff";
    ctx.lineWidth = grow;
    ctx.beginPath();
    for (const ring of rings) {
      ring.forEach(([lng, lat], k) => ctx[k ? "lineTo" : "moveTo"](off + (lng - west) * sx, off + (north - lat) * sy));
      ctx.closePath();
    }
    ctx.fill();
    if (grow) ctx.stroke();
    return canvas;
  };
  const [mw, mh] = [2048, Math.round((2048 * H) / W)];
  const mask = new CanvasTexture(drawMask(mw, mh, mw / (east - west), mh / (north - south), 0));
  const gw = Math.floor((W - 1) / detail) + 1; // grid points used
  const gh = Math.floor((H - 1) / detail) + 1;
  const near = drawMask(gw, gh, 1 / (detail * step), 1 / (detail * step), 3).getContext("2d").getImageData(0, 0, gw, gh).data;

  // Surface: only the grid cells on or next to land
  const index = new Int32Array(gw * gh).fill(-1);
  const pos = [], uv = [], col = [], tris = [];
  const color = new Color();
  const vertex = (i, j) => {
    if (index[j * gw + i] < 0) {
      index[j * gw + i] = pos.length / 3;
      const [gi, gj] = [i * detail, j * detail];
      const m = metres[gj * W + gi];
      const [x, y] = toPlane(west + gi * step, north - gj * step);
      pos.push(x, groundY(m), -y);
      uv.push(gi / (W - 1), 1 - gj / (H - 1));
      tint(m, color);
      col.push(color.r, color.g, color.b);
    }
    return index[j * gw + i];
  };
  const isNear = (i, j) => near[(j * gw + i) * 4] > 0;
  for (let j = 0; j < gh - 1; j++) {
    for (let i = 0; i < gw - 1; i++) {
      if (!(isNear(i, j) || isNear(i + 1, j) || isNear(i, j + 1) || isNear(i + 1, j + 1))) continue;
      const a = vertex(i, j), b = vertex(i + 1, j), c = vertex(i, j + 1), d = vertex(i + 1, j + 1);
      tris.push(a, c, b, b, c, d);
    }
  }
  const surface = new BufferGeometry();
  surface.setAttribute("position", new Float32BufferAttribute(pos, 3));
  surface.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  surface.setAttribute("color", new Float32BufferAttribute(col, 3));
  surface.setIndex(tris);
  surface.computeVertexNormals();

  // Sides from the sea up to the ground along the coast, and the gold outline along their top
  const walls = [], coast = [];
  for (const ring of rings) {
    const pts = ring.map(([lng, lat]) => [...toPlane(lng, lat), groundY(at(lng, lat))]);
    pts.forEach(([x1, y1, h1], k) => {
      const [x2, y2, h2] = pts[(k + 1) % pts.length];
      walls.push(x1, 0, -y1, x2, 0, -y2, x2, h2, -y2, x1, 0, -y1, x2, h2, -y2, x1, h1, -y1);
      coast.push(x1, h1 + 0.004, -y1, x2, h2 + 0.004, -y2);
    });
  }
  const sides = new BufferGeometry();
  sides.setAttribute("position", new Float32BufferAttribute(walls, 3));
  sides.computeVertexNormals();
  const outline = new BufferGeometry();
  outline.setAttribute("position", new Float32BufferAttribute(coast, 3));

  return { surface, mask, sides, outline };
}

function Land({ terrain }) {
  // phones get every other grid point (a quarter of the triangles)
  const { surface, mask, sides, outline } = useMemo(
    () => buildLand(terrain, Math.min(window.innerWidth, window.innerHeight) < 600 ? 2 : 1),
    [terrain],
  );
  return (
    <>
      <mesh geometry={surface}>
        <meshStandardMaterial vertexColors alphaMap={mask} alphaTest={0.5} alphaToCoverage roughness={0.92} metalness={0} />
      </mesh>
      <mesh geometry={sides}>
        <meshStandardMaterial color={WALL} side={DoubleSide} roughness={0.95} metalness={0} />
      </mesh>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color={GOLD} transparent opacity={0.55} />
      </lineSegments>
    </>
  );
}

/** A dotted "sea" grid that fades into the fog */
function SeaDots() {
  const geometry = useMemo(() => {
    const pos = [];
    for (let x = -36; x <= 36; x += 0.5) for (let z = -36; z <= 36; z += 0.5) pos.push(x, 0, z);
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#8391ff" size={0.045} sizeAttenuation transparent opacity={0.32} depthWrite={false} />
    </points>
  );
}

/** Destination pin: pulsing ring on the ground, thin stem, glowing head; when active, a tag with photo and name */
function Pin({ place, active, glow, phase, still, homeLabel, onSelect }) {
  const ring = useRef(null);
  const head = useRef(null);
  const halo = useRef(null);

  useFrame((state, dt) => {
    const t = still ? 0.35 : (state.clock.elapsedTime * 0.6 + phase) % 1;
    ring.current.scale.setScalar(0.4 + t * (active ? 2.4 : place.home ? 1.7 : 1.2));
    ring.current.material.opacity = (1 - t) * (active ? 0.9 : 0.45);
    const s = still ? (active ? 1.7 : 1) : MathUtils.damp(head.current.scale.x, active ? 1.7 : 1, 6, dt);
    head.current.scale.setScalar(s);
    halo.current.scale.setScalar(s * (place.home ? 0.6 : 0.45));
  });

  const setCursor = (c) => () => (document.body.style.cursor = c);

  return (
    <group position={place.position}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.2, 0.24, 48]} />
        <meshBasicMaterial color={GOLD} transparent depthWrite={false} />
      </mesh>
      <mesh position-y={PIN_H / 2}>
        <cylinderGeometry args={[0.012, 0.012, PIN_H, 6]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.55} />
      </mesh>
      <group position-y={PIN_H}>
        <mesh ref={head}>
          <sphereGeometry args={[place.home ? 0.11 : 0.08, 24, 24]} />
          <meshBasicMaterial color={place.home ? "#ffffff" : GOLD} />
        </mesh>
        <sprite ref={halo}>
          <spriteMaterial map={glow} color={GOLD} blending={AdditiveBlending} transparent depthWrite={false} />
        </sprite>
        {/* invisible, larger hit area so the pin is easy to click; the nearest pin wins where pins overlap */}
        <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }} onPointerOver={setCursor("pointer")} onPointerOut={setCursor("")}>
          <sphereGeometry args={[0.38, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {active && (
          <Html zIndexRange={[5, 0]} pointerEvents="none">
            <div className={styles.label}>
              {place.photo && <img className={styles.photo} src={place.photo} alt="" decoding="async" />}
              <div className={styles.text}>
                {place.home && <span className={styles.home}>{homeLabel}</span>}
                <strong>{place.name}</strong>
                <span className={styles.region}>{place.region}</span>
                {place.note && <span className={styles.note}>{place.note}</span>}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/** Dashed gold arc from home to a destination; the dashes flow outwards */
function Route({ from, to, active, still }) {
  const ref = useRef(null);
  const points = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 0.5 + from.distanceTo(to) * 0.3;
    return new QuadraticBezierCurve3(from, mid, to).getPoints(64);
  }, [from, to]);

  useFrame((_, dt) => {
    const m = ref.current.material;
    if (!still) m.dashOffset -= dt * (active ? 0.9 : 0.3);
    m.opacity = still ? (active ? 0.95 : 0.3) : MathUtils.damp(m.opacity, active ? 0.95 : 0.3, 5, dt);
  });

  return (
    <Line ref={ref} points={points} color={GOLD} lineWidth={active ? 2.2 : 1.1} dashed dashSize={0.3} gapSize={0.2} transparent opacity={0.3} depthWrite={false} />
  );
}

const OVERVIEW = { target: new Vector3(0.4, 0, -0.6), distance: 25 };
// Where the focus sits, in half-screens from the centre: [right, up]. Wide screens: beside the hero
// text and a little low, so the photo tag above the pin clears the header. Phones: above the text.
const FOCUS = { wide: [0.48, -0.42], narrow: [0, 0.2] };

/**
 * Moves the camera: whole-country overview, or a closer look at the active pin.
 * Drifts gently and leans a little toward the mouse. The camera is slid sideways (wide
 * screens) or down (phones) so the focus sits beside / above the hero text — moving the
 * camera itself keeps what you see and what you click in sync.
 */
function CameraRig({ focus, still }) {
  const { camera, size, invalidate } = useThree();
  const look = useRef(OVERVIEW.target.clone());
  const goal = useMemo(() => new Vector3(), []);
  const lookGoal = useMemo(() => new Vector3(), []);
  const wide = size.width > 900;
  const portrait = size.height > size.width;

  useEffect(() => invalidate(), [focus, size, invalidate]);

  useFrame((state, dt) => {
    const target = focus ?? OVERVIEW.target;
    const distance = (focus ? 12 : OVERVIEW.distance) * (portrait ? 1.4 : 1);
    const t = state.clock.elapsedTime;
    // slow drift + a slight lean toward the mouse (kept small so pins don't slide away from the cursor)
    const yaw = still ? 0 : Math.sin(t * 0.08) * 0.18 + state.pointer.x * 0.02;
    const pitch = 0.95 + (still ? 0 : state.pointer.y * 0.01); // ~55° above the horizon

    // slide along the camera's right / up directions to put the focus off-centre
    const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * distance;
    const [fx, fy] = wide ? FOCUS.wide : FOCUS.narrow;
    const sideways = -fx * halfH * camera.aspect;
    const down = -fy * halfH;
    const [sy, cy, sp, cp] = [Math.sin(yaw), Math.cos(yaw), Math.sin(pitch), Math.cos(pitch)];
    lookGoal.set(
      target.x + cy * sideways - sy * sp * down,
      target.y + cp * down,
      target.z - sy * sideways - cy * sp * down,
    );
    goal.set(lookGoal.x + sy * cp * distance, lookGoal.y + sp * distance, lookGoal.z + cy * cp * distance);

    if (still) {
      camera.position.copy(goal);
      look.current.copy(lookGoal);
    } else {
      camera.position.x = MathUtils.damp(camera.position.x, goal.x, 1.4, dt);
      camera.position.y = MathUtils.damp(camera.position.y, goal.y, 1.4, dt);
      camera.position.z = MathUtils.damp(camera.position.z, goal.z, 1.4, dt);
      look.current.x = MathUtils.damp(look.current.x, lookGoal.x, 1.8, dt);
      look.current.y = MathUtils.damp(look.current.y, lookGoal.y, 1.8, dt);
      look.current.z = MathUtils.damp(look.current.z, lookGoal.z, 1.8, dt);
    }
    camera.lookAt(look.current);
  });
  return null;
}

/**
 * Props:
 *  places      [{ id, name, region, coords: { lat, lng }, home, photo (url), note }] in tour order
 *  active      index of the highlighted place (-1 = whole-country overview)
 *  onSelect    (index) => void, when a pin is clicked
 *  running     false pauses rendering (hero off screen / tab hidden)
 *  still       true for "reduce motion": no drifting, pulsing or camera flights
 */
export default function JapanMap({ places, active, onSelect, running, still, homeLabel }) {
  const [ready, setReady] = useState(false);
  const [terrain, setTerrain] = useState(null);
  const glow = useMemo(makeGlowTexture, []);
  // pins stand on the ground, so a pin on a mountain sits higher
  const pins = useMemo(
    () => (terrain ? places.map((p) => ({ ...p, position: toWorld(p.coords, groundY(terrain.at(p.coords.lng, p.coords.lat))) })) : []),
    [places, terrain],
  );
  const routes = useMemo(() => {
    const home = pins.find((p) => p.home);
    if (!home) return [];
    const top = (p) => p.position.clone().setY(p.position.y + PIN_H);
    return pins.filter((p) => p !== home).map((p) => ({ place: p, from: top(home), to: top(p) }));
  }, [pins]);
  const focus = pins[active]?.position;

  useEffect(() => {
    let live = true;
    loadTerrain().then((t) => live && setTerrain(t));
    return () => { live = false; };
  }, []);

  if (!terrain) return null;

  return (
    <Canvas
      className={cx(styles.canvas, ready && styles.ready)}
      dpr={[1, 1.75]}
      frameloop={!running ? "never" : still ? "demand" : "always"}
      camera={{ fov: 35, near: 0.1, far: 200, position: [2, 27, 20] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => setReady(true)}
    >
      <fog attach="fog" args={[FOG, 16, 56]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 14, 8]} intensity={1.7} color="#fff1d6" />
      <directionalLight position={[-8, 6, -6]} intensity={0.4} color="#6f7bff" />
      <SeaDots />
      <Land terrain={terrain} />
      {routes.map(({ place, from, to }) => (
        <Route key={place.id} from={from} to={to} active={pins[active] === place} still={still} />
      ))}
      {pins.map((p, i) => (
        <Pin key={p.id} place={p} active={i === active} glow={glow} phase={i * 0.13} still={still} homeLabel={homeLabel} onSelect={() => onSelect(i)} />
      ))}
      <CameraRig focus={focus} still={still} />
    </Canvas>
  );
}
