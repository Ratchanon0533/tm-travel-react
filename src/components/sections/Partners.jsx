import { useEffect, useMemo, useRef } from "react";
import SectionHeading from "../ui/SectionHeading.jsx";
import Icon from "../ui/Icon.jsx";
import { partners } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { asset } from "../../lib/paths.js";
import styles from "./Partners.module.css";

/** Simple shapes for the placeholder logos */
const MARKS = {
  circle: <circle cx="12" cy="12" r="9" />,
  mountain: <path d="M2 20 9 7l4 7 3-4 6 10z" />,
  wave: <path d="M2 14c3-4 5-4 8 0s5 4 8 0 3-3 4-2v6H2z" />,
  diamond: <path d="M12 2 22 12 12 22 2 12z" />,
  sun: <><circle cx="12" cy="12" r="5" /><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4z" /></>,
  arc: <path d="M2 20a10 10 0 0 1 20 0h-5a5 5 0 0 0-10 0z" />,
  square: <rect x="3" y="3" width="18" height="18" rx="4" />,
  triangle: <path d="M12 3 22 21H2z" />,
};

// The stream has two depths: far logos are smaller, fainter and slower; near ones bigger and faster.
// y: height in the stream (0 top … 1 bottom) · speed: px per second
const LAYERS = [
  { y: 0.3, scale: 0.86, speed: 18 },
  { y: 0.72, scale: 1, speed: 30 },
];
const MARGIN = 180; // px past each edge where logos leave and come back
const MIN_GAP = 90; // px at least between logos of the same depth (matters on narrow screens)

/** Repeatable "random" numbers, so the page from the server and the browser lay the logos out alike */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where each logo starts, and its own bob (how high, how wide, how fast) */
function layout(logos) {
  const rand = seeded(7);
  const perLayer = LAYERS.map((_, l) => logos.filter((_, i) => i % LAYERS.length === l).length);
  const seen = LAYERS.map(() => 0);
  return logos.map((logo, i) => {
    const layer = i % LAYERS.length;
    return {
      logo,
      layer,
      // 0…1 along the stream: the depths interleave, each logo nudged a little off its slot
      x: (seen[layer]++ + (layer + 0.5) / LAYERS.length + (rand() - 0.5) * 0.35) / perLayer[layer],
      y: LAYERS[layer].y + (rand() - 0.5) * 0.06,
      amp: 4 + rand() * 6, // px up and down
      length: 380 + rand() * 420, // px per bob
      phase: rand() * Math.PI * 2,
      pace: 0.35 + rand() * 0.5,
    };
  });
}

/** A partner's logo: their image from /public when "logo" is set, otherwise a placeholder mark + name */
function Logo({ partner }) {
  if (partner.logo) return <img className={styles.image} src={asset(partner.logo)} alt={partner.name} loading="lazy" decoding="async" />;
  return (
    <span className={styles.placeholder}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{MARKS[partner.mark] ?? MARKS.circle}</svg>
      {partner.name}
    </span>
  );
}

/**
 * Logos drifting like things carried by water: two depths at different speeds, each logo bobbing
 * and tilting in its own rhythm, with tiny specks flowing past (a canvas). The flow calms under the
 * mouse, pauses while off screen, and is a still row with "reduce motion".
 */
function LogoStream({ logos, label }) {
  const box = useRef(null);
  const canvas = useRef(null);
  const items = useMemo(() => layout(logos), [logos]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const boxEl = box.current;
    const ctx = canvas.current.getContext("2d");
    const lis = [...boxEl.querySelectorAll("li")];
    lis.forEach((li) => { li.style.left = "0"; li.style.top = "0"; }); // from here on, placed by transform
    const css = getComputedStyle(boxEl);
    const colors = [css.getPropertyValue("--gold").trim() || "#f8b62d", css.getPropertyValue("--navy").trim() || "#171c61"];
    const perLayer = LAYERS.map((_, l) => items.filter((it) => it.layer === l).length);
    let W = 0, H = 0, loop = 1, sizes = [], specks = [];

    const measure = () => {
      W = boxEl.clientWidth;
      H = boxEl.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.current.width = W * dpr;
      canvas.current.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizes = lis.map((li) => [li.offsetWidth, li.offsetHeight]);
      // one lap of the stream: the strip plus margins, longer if the logos would otherwise crowd
      const widest = Math.max(...sizes.map(([w]) => w));
      loop = Math.max(W + 2 * MARGIN, Math.max(...perLayer) * (widest + MIN_GAP));
      specks = Array.from({ length: W < 600 ? 26 : 48 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 1.8,
        speed: 12 + Math.random() * 46, amp: 3 + Math.random() * 10, length: 160 + Math.random() * 420,
        phase: Math.random() * Math.PI * 2, color: colors[Math.random() < 0.45 ? 0 : 1], alpha: 0.12 + Math.random() * 0.33,
      }));
    };

    const travelled = LAYERS.map(() => 0);
    let flow = 1, target = 1, time = 0, last = 0, frame = 0;
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      flow += (target - flow) * Math.min(1, dt * 2.5); // calms under the mouse, picks up again after
      time += dt * (0.4 + 0.6 * flow);
      LAYERS.forEach((layer, l) => { travelled[l] += layer.speed * flow * dt; });

      items.forEach((it, i) => {
        const x = (((it.x * loop - travelled[it.layer]) % loop) + loop) % loop - MARGIN;
        const k = (2 * Math.PI) / it.length;
        const angle = k * x + it.phase + time * it.pace;
        const y = it.y * H + it.amp * Math.sin(angle);
        const tilt = Math.max(-4, Math.min(4, it.amp * k * Math.cos(angle) * 35)); // leans with the swell
        const [w, h] = sizes[i];
        lis[i].style.transform = `translate3d(${(x - w / 2).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${LAYERS[it.layer].scale})`;
      });

      ctx.clearRect(0, 0, W, H);
      for (const s of specks) {
        s.x -= s.speed * flow * dt;
        if (s.x < -10) { s.x = W + 10; s.y = Math.random() * H; }
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y + s.amp * Math.sin((2 * Math.PI * s.x) / s.length + s.phase + time * 0.8), s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    const ro = new ResizeObserver(measure); // also catches fonts / logo images loading
    const calm = () => { target = 0.15; };
    const flowOn = () => { target = 1; };

    measure();
    ro.observe(boxEl);
    lis.forEach((li) => ro.observe(li));
    io.observe(boxEl);
    boxEl.addEventListener("pointerenter", calm);
    boxEl.addEventListener("pointerleave", flowOn);
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      boxEl.removeEventListener("pointerenter", calm);
      boxEl.removeEventListener("pointerleave", flowOn);
    };
  }, [items]);

  return (
    <div ref={box} className={styles.stream} role="region" aria-label={label}>
      <canvas ref={canvas} className={styles.specks} aria-hidden="true" />
      <ul className={styles.logos}>
        {/* the starting spots (before the animation takes over, and for the prerendered page) */}
        {items.map((it) => (
          <li key={it.logo.name} data-layer={it.layer} style={{ left: `${(it.x * 100).toFixed(1)}%`, top: `${(it.y * 100).toFixed(1)}%` }}>
            <Logo partner={it.logo} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * B2B section for travel agencies, tour operators and group planners: partner logos drifting on a
 * stream, the kinds of partners we work with, and a link to the contact section.
 * Logos and partner types: src/data/partners.json · text: "partners.*" in src/i18n.
 * The logos are placeholders — replace them with real partners (with their permission).
 */
export default function Partners() {
  const { t } = useI18n();
  return (
    <section className={`section ${styles.partners}`} id="partners">
      <div className="container">
        <SectionHeading className={styles.heading} eyebrow={t("partners.eyebrow")} title={t("partners.title")} sub={t("partners.sub")} />
      </div>

      <LogoStream logos={partners.logos} label={t("partners.logos")} />

      <div className="container">
        <ol className={styles.types}>
          {partners.types.map((type, i) => (
            <li key={type.title} className={`${styles.type} reveal`} style={{ "--delay": `${i * 0.1}s` }}>
              <span className={styles.icon}><Icon name={type.icon} size={24} /></span>
              <h3>{t(type.title)}</h3>
              <p>{t(type.text)}</p>
            </li>
          ))}
        </ol>
        <div className={`${styles.cta} reveal`}>
          <a href="#contact">{t("partners.cta")}<Icon name="arrow" /></a>
        </div>
      </div>
    </section>
  );
}
