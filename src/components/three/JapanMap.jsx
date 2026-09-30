/**
 * 3D map of Japan behind the hero (browser only — loaded lazily by Hero.jsx).
 * Coastline: src/data/japan-map.json (made by scripts/build-japan-map.mjs)
 * Pins: "coords" in src/data/destinations/*.json · routes start at the destination with "home": true
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, ExtrudeGeometry, Float32BufferAttribute,
  MathUtils, QuadraticBezierCurve3, Shape, Vector2, Vector3,
} from "three";
import map from "../../data/japan-map.json";
import { cx } from "../../lib/cx.js";
import styles from "./JapanMap.module.css";

// Scene colors (brand navy & gold from tokens.css)
const GOLD = "#f8b62d";
const LAND = "#303d96";
const FOG = "#0a0e36";

const CENTER = { lng: 136.5, lat: 35.2 }; // middle of the map
const LNG_SCALE = Math.cos((CENTER.lat * Math.PI) / 180); // keeps the islands in proportion
const LAND_H = 0.32; // thickness of the islands
const PIN_H = 1.05; // pin height above the land
const MT_FUJI = { lat: 35.36, lng: 138.73 };

/** lng/lat → flat map position (x east, y north) */
const toPlane = (lng, lat) => [(lng - CENTER.lng) * LNG_SCALE, lat - CENTER.lat];
/** { lat, lng } → 3D position (the map lies flat; north points away from the camera) */
const toWorld = ({ lat, lng }, height = LAND_H) => {
  const [x, y] = toPlane(lng, lat);
  return new Vector3(x, height, -y);
};

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

/** The islands (extruded coastline) with a thin gold outline on top */
function Land() {
  const [land, coast] = useMemo(() => {
    const rings = map.islands.map((ring) => {
      const pts = ring.map(([lng, lat]) => new Vector2(...toPlane(lng, lat)));
      if (pts[0].equals(pts[pts.length - 1])) pts.pop();
      return pts;
    });
    const land = new ExtrudeGeometry(rings.map((pts) => new Shape(pts)), { depth: LAND_H, bevelEnabled: false });
    land.rotateX(-Math.PI / 2);

    const segments = [];
    const y = LAND_H + 0.003;
    for (const pts of rings) {
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        segments.push(p.x, y, -p.y, q.x, y, -q.y);
      });
    }
    const coast = new BufferGeometry();
    coast.setAttribute("position", new Float32BufferAttribute(segments, 3));
    return [land, coast];
  }, []);

  return (
    <>
      <mesh geometry={land}>
        <meshStandardMaterial color={LAND} roughness={0.85} metalness={0.05} />
      </mesh>
      <lineSegments geometry={coast}>
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

/** Mt. Fuji: a small snow-capped cone */
function Fuji() {
  const p = toWorld(MT_FUJI);
  return (
    <group position={p}>
      <mesh position-y={0.4}>
        <coneGeometry args={[0.42, 0.8, 7, 1, true]} />
        <meshStandardMaterial color="#3a47a6" roughness={0.9} flatShading />
      </mesh>
      <mesh position-y={0.66}>
        <coneGeometry args={[0.147, 0.28, 7]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.7} flatShading />
      </mesh>
    </group>
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
  const glow = useMemo(makeGlowTexture, []);
  const pins = useMemo(() => places.map((p) => ({ ...p, position: toWorld(p.coords) })), [places]);
  const routes = useMemo(() => {
    const home = pins.find((p) => p.home);
    if (!home) return [];
    const top = (p) => p.position.clone().setY(LAND_H + PIN_H);
    return pins.filter((p) => p !== home).map((p) => ({ place: p, from: top(home), to: top(p) }));
  }, [pins]);
  const focus = pins[active]?.position;

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
      <Land />
      <Fuji />
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
