/**
 * Seasonal particles drifting over the Seasons panels (browser only — loaded lazily by Seasons.jsx):
 * spring cherry-blossom petals · summer fireflies · autumn maple leaves · winter snow.
 * Sizes and speeds are in screen pixels, so they look the same on every screen size.
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Color, DoubleSide, MathUtils, Object3D, PlaneGeometry, Shape, ShapeGeometry } from "three";
import styles from "./SeasonParticles.module.css";

/** Look of each season — `size` and `fall` (px/s) are [min, max]; `density` scales the count */
const KINDS = {
  spring: { shape: "petal", colors: ["#ffd3de", "#ffc1d0", "#fde6ec", "#f7adc2"], size: [11, 18], fall: [28, 55], sway: 40, spin: 1.8, density: 1, opacity: 0.95 },
  summer: { shape: "glow", colors: ["#fff5a5", "#eaff9c", "#ffe17a"], size: [24, 42], fall: [-6, 6], sway: 26, spin: 0, density: 0.9, opacity: 1 },
  autumn: { shape: "maple", colors: ["#e4502b", "#f08a24", "#c9321c", "#f4b13a"], size: [16, 26], fall: [35, 70], sway: 55, spin: 1.3, density: 0.75, opacity: 0.95 },
  winter: { shape: "dot", colors: ["#ffffff", "#eef3ff"], size: [6, 13], fall: [22, 45], sway: 18, spin: 0, density: 1.7, opacity: 0.9 },
};

const CAMERA_Z = 10;
const FOV = 40;
const DEPTH = 2.5; // particles spread from -DEPTH to +DEPTH around the middle plane
const rand = ([min, max]) => min + Math.random() * (max - min);

function petalGeometry() {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.42, -0.25, 0.42, 0.3, 0.12, 0.5);
  s.lineTo(0, 0.38); // the little notch at the tip
  s.lineTo(-0.12, 0.5);
  s.bezierCurveTo(-0.42, 0.3, -0.42, -0.25, 0, -0.5);
  return new ShapeGeometry(s, 8);
}

function mapleGeometry() {
  // right half of a five-lobed leaf (top → stem), mirrored for the left half
  const half = [[0, 1], [0.14, 0.52], [0.62, 0.72], [0.42, 0.28], [0.95, 0.18], [0.48, -0.02], [0.55, -0.42], [0.12, -0.28], [0.03, -0.35], [0.03, -0.75]];
  const pts = [...half, ...half.slice(1).reverse().map(([x, y]) => [-x, y])];
  const s = new Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x / 2, y / 2) : s.moveTo(x / 2, y / 2)));
  return new ShapeGeometry(s);
}

function softDotTexture() {
  const canvas = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/** One season's particles */
function Flock({ kind, fade }) {
  const mesh = useRef(null);
  const { size, viewport } = useThree();
  const px = viewport.height / size.height; // world units per screen pixel on the middle plane
  const count = Math.round(MathUtils.clamp((size.width * size.height) / 11000, 20, 110) * kind.density);

  const geometry = useMemo(() => (kind.shape === "petal" ? petalGeometry() : kind.shape === "maple" ? mapleGeometry() : new PlaneGeometry(1, 1)), [kind]);
  const texture = useMemo(() => (kind.shape === "glow" || kind.shape === "dot" ? softDotTexture() : null), [kind]);
  const dummy = useMemo(() => new Object3D(), []);

  // Visible half-height/width at depth z
  const halfH = (z) => (CAMERA_Z - z) * Math.tan(MathUtils.degToRad(FOV / 2));
  const halfW = (z) => halfH(z) * (size.width / size.height);

  const spawn = (p, anywhere) => {
    p.z = rand([-DEPTH, DEPTH]);
    p.x = rand([-halfW(p.z), halfW(p.z)]);
    p.y = anywhere || kind.fall[1] <= 0 ? rand([-halfH(p.z), halfH(p.z)]) : halfH(p.z) + 1;
    p.size = rand(kind.size) * px;
    p.fall = rand(kind.fall) * px;
    p.sway = rand([0.5, 1]) * kind.sway * px;
    p.swayFreq = rand([0.4, 1.1]);
    p.phase = Math.random() * Math.PI * 2;
    p.rot = [Math.random() * 6, Math.random() * 6, Math.random() * 6];
    p.spin = [rand([-1, 1]) * kind.spin, rand([-1, 1]) * kind.spin, rand([-1, 1]) * kind.spin * 0.5];
    return p;
  };
  const particles = useMemo(() => Array.from({ length: count }, () => spawn({}, true)), [count, kind, px]);

  useLayoutEffect(() => {
    const c = new Color();
    particles.forEach((_, i) => mesh.current.setColorAt(i, c.set(kind.colors[i % kind.colors.length])));
    mesh.current.instanceColor.needsUpdate = true;
  }, [particles, kind]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05); // no big jumps after the tab was hidden
    particles.forEach((p, i) => {
      p.y -= p.fall * step;
      p.x += Math.sin(t * p.swayFreq + p.phase) * p.sway * step;
      if (kind.shape === "glow") p.y += Math.cos(t * p.swayFreq * 0.8 + p.phase) * p.sway * step; // fireflies wander
      p.rot[0] += p.spin[0] * step;
      p.rot[1] += p.spin[1] * step;
      p.rot[2] += p.spin[2] * step;

      const h = halfH(p.z) + 1.2;
      const w = halfW(p.z) + 1.2;
      if (p.y < -h) spawn(p, false);
      else if (p.y > h) p.y = -h + 0.1;
      if (p.x > w) p.x = -w;
      else if (p.x < -w) p.x = w;

      const blink = kind.shape === "glow" ? 0.3 + 0.7 * Math.max(0, Math.sin(t * 1.6 + p.phase * 3)) ** 2 : 1;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
      dummy.scale.setScalar(p.size * blink);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.material.opacity = kind.opacity * fade.current;
  });

  const flat = kind.shape === "glow" || kind.shape === "dot";
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      {flat ? (
        <meshBasicMaterial map={texture} transparent depthWrite={false} {...(kind.shape === "glow" && { blending: AdditiveBlending })} />
      ) : (
        <meshLambertMaterial side={DoubleSide} transparent />
      )}
    </instancedMesh>
  );
}

/** Cross-fades between seasons: the old particles fade out, then the new ones fade in */
function Seasonal({ season }) {
  const [shown, setShown] = useState(season);
  const fade = useRef(0);
  useFrame((_, dt) => {
    const leaving = shown !== season;
    fade.current = MathUtils.damp(fade.current, leaving ? 0 : 1, leaving ? 8 : 2.5, dt);
    if (leaving && fade.current < 0.02) setShown(season);
  });
  return KINDS[shown] ? <Flock key={shown} kind={KINDS[shown]} fade={fade} /> : null;
}

/** Props: season ("spring" | "summer" | "autumn" | "winter"), running (false pauses it off screen) */
export default function SeasonParticles({ season, running }) {
  return (
    <div className={styles.fx} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} frameloop={running ? "always" : "never"} camera={{ position: [0, 0, CAMERA_Z], fov: FOV }} gl={{ alpha: true, antialias: true }} style={{ pointerEvents: "none" }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 6]} intensity={1.2} />
        <Seasonal season={season} />
      </Canvas>
    </div>
  );
}
