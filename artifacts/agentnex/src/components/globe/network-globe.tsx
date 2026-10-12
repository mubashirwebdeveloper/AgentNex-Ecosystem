import { useEffect, useRef } from "react";
import { Users, Building2, Bot, Truck, Code2, Sparkles, type LucideIcon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export type CategoryId = "humans" | "businesses" | "agents" | "suppliers" | "developers" | "opportunities";

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  lat: number;
  lon: number;
  summary: string;
  role: string;
}[] = [
  { id: "humans", label: "Humans", icon: Users, lat: 40, lon: -74, summary: "People establish a verified identity they control, then choose what to share and with whom.", role: "Own their identity, grant permissions, approve actions taken on their behalf." },
  { id: "businesses", label: "Businesses", icon: Building2, lat: 50, lon: 8, summary: "Companies represent themselves with verified profiles and authorize people and agents to act for them.", role: "Publish verified profiles, manage members, set policies for agents." },
  { id: "agents", label: "AI Agents", icon: Bot, lat: 35, lon: 137, summary: "Every agent carries a passport: who owns it, what it can do, and what it is allowed to do.", role: "Act within declared, revocable permissions, always traceable to an owner." },
  { id: "suppliers", label: "Suppliers", icon: Truck, lat: 23, lon: 113, summary: "Suppliers become discoverable through verification, then respond to requests on their own terms.", role: "Receive requests for quotation, respond, build a verified track record." },
  { id: "developers", label: "Developers", icon: Code2, lat: 13, lon: 77, summary: "Developers build agents and integrations on documented APIs, scoped keys and clear audit trails.", role: "Register agents, integrate through APIs and webhooks, publish to the marketplace." },
  { id: "opportunities", label: "Opportunities", icon: Sparkles, lat: -15, lon: -50, summary: "Opportunities emerge when trusted parties can find each other and agree on how to work together.", role: "Partnerships, contracts and workflows formed between verified participants." },
];

const LAND: [number, number, number, number][] = [
  [48, -100, 22, 32], [30, -95, 12, 18], [62, -150, 10, 20], [72, -42, 10, 14], [15, -88, 6, 8],
  [-5, -62, 15, 15], [-28, -62, 14, 9], [-45, -69, 8, 5],
  [50, 12, 12, 18], [62, 20, 8, 14],
  [8, 20, 16, 20], [-15, 25, 15, 12], [22, 10, 10, 22], [25, 45, 10, 12],
  [55, 90, 15, 50], [35, 100, 12, 25], [22, 80, 10, 8], [12, 104, 8, 8],
  [-3, 115, 5, 15], [36, 138, 7, 4], [-25, 134, 10, 17],
];

const DEG = Math.PI / 180;
type V3 = [number, number, number];

function toXYZ(lat: number, lon: number): V3 {
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function isLand(lat: number, lon: number) {
  for (const [la, lo, hl, hw] of LAND) {
    let d = lon - lo;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    if (((lat - la) / hl) ** 2 + (d / hw) ** 2 < 1) return true;
  }
  return false;
}

const DOTS: V3[] = (() => {
  const out: V3[] = [];
  for (let lat = -70; lat <= 80; lat += 2.6) {
    const step = 2.6 / Math.max(0.2, Math.cos(lat * DEG));
    for (let lon = -180; lon < 180; lon += step) if (isLand(lat, lon)) out.push(toXYZ(lat, lon));
  }
  return out;
})();

const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [0, 5], [5, 1], [3, 2], [4, 5], [0, 2]];

function slerp(a: V3, b: V3, t: number): V3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-4) return a;
  const s = Math.sin(om);
  const ka = Math.sin((1 - t) * om) / s, kb = Math.sin(t * om) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

type Props = {
  selected: CategoryId | null;
  onSelect: (id: CategoryId) => void;
  className?: string;
  showLabels?: boolean;
};

export function NetworkGlobe({ selected, onSelect, className, showLabels = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const state = useRef({ rot: -40 * DEG, target: null as number | null, tilt: -0.32, drag: null as null | { x: number; rot: number; moved: boolean }, hover: -1 });
  const selRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const labelsRef = useRef(showLabels);
  labelsRef.current = showLabels;

  useEffect(() => {
    selRef.current = selected;
    if (selected) {
      const c = CATEGORIES.find((x) => x.id === selected)!;
      let target = -c.lon * DEG;
      const cur = state.current.rot;
      while (target - cur > Math.PI) target -= Math.PI * 2;
      while (target - cur < -Math.PI) target += Math.PI * 2;
      state.current.target = target;
    }
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = performance.now(), t0 = last;
    const nodeScreen: { x: number; y: number; z: number }[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      if (reduce) draw(performance.now());
    };

    const project = (p: V3, R: number, cx: number, cy: number, lift = 1) => {
      const s = state.current;
      const cr = Math.cos(s.rot), sr = Math.sin(s.rot);
      const x1 = p[0] * cr + p[2] * sr;
      const z1 = -p[0] * sr + p[2] * cr;
      const ct = Math.cos(s.tilt), st = Math.sin(s.tilt);
      const y2 = p[1] * ct - z1 * st;
      const z2 = p[1] * st + z1 * ct;
      return { x: cx + x1 * R * lift, y: cy - y2 * R * lift, z: z2 };
    };

    const draw = (now: number) => {
      const dark = themeRef.current === "dark";
      const time = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2;
      const blue = dark ? "47,123,255" : "21,101,230";
      const cyan = dark ? "34,211,238" : "8,145,178";
      const ember = "255,138,61";

      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      halo.addColorStop(0, `rgba(${blue},${dark ? 0.28 : 0.14})`);
      halo.addColorStop(1, `rgba(${blue},0)`);
      ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);

      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, dark ? "rgba(22,44,100,0.95)" : "rgba(226,236,252,1)");
      body.addColorStop(1, dark ? "rgba(6,12,32,0.98)" : "rgba(196,214,244,1)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
      ctx.strokeStyle = `rgba(${cyan},${dark ? 0.45 : 0.5})`; ctx.lineWidth = 1; ctx.stroke();

      // graticule
      ctx.strokeStyle = `rgba(${blue},${dark ? 0.12 : 0.14})`;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); let pen = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = project(toXYZ(lat, lon), R, cx, cy);
          if (p.z > 0) { if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; } else pen = false;
        }
        ctx.stroke();
      }

      for (const d of DOTS) {
        const p = project(d, R, cx, cy);
        if (p.z <= 0) continue;
        ctx.fillStyle = `rgba(${cyan},${0.18 + p.z * (dark ? 0.6 : 0.55)})`;
        const s = 0.6 + p.z * 1.1;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }

      const nodes = CATEGORIES.map((c) => toXYZ(c.lat, c.lon));
      const selIdx = CATEGORIES.findIndex((c) => c.id === selRef.current);

      LINKS.forEach(([a, b], li) => {
        const active = selIdx === a || selIdx === b;
        const rgb = active ? ember : cyan;
        ctx.lineWidth = active ? 1.6 : 1;
        let prev: { x: number; y: number; z: number } | null = null;
        const N = 40;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const p = project(slerp(nodes[a], nodes[b], t), R, cx, cy, 1 + 0.22 * Math.sin(Math.PI * t));
          if (prev && p.z > -0.15 && prev.z > -0.15) {
            ctx.strokeStyle = `rgba(${rgb},${(active ? 0.85 : 0.35) * Math.min(1, (p.z + 0.15) * 2)})`;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
          prev = p;
        }
        if (!reduce) {
          const t = (time * 0.25 + li * 0.17) % 1;
          const p = project(slerp(nodes[a], nodes[b], t), R, cx, cy, 1 + 0.22 * Math.sin(Math.PI * t));
          if (p.z > 0) {
            ctx.fillStyle = `rgba(${active ? ember : "200,240,255"},0.95)`;
            ctx.beginPath(); ctx.arc(p.x, p.y, active ? 2.4 : 1.6, 0, Math.PI * 2); ctx.fill();
          }
        }
      });

      nodeScreen.length = 0;
      CATEGORIES.forEach((c, i) => {
        const p = project(nodes[i], R, cx, cy);
        nodeScreen.push(p);
        if (p.z < -0.05) return;
        const isSel = i === selIdx, isHover = i === state.current.hover;
        const rgb = isSel ? ember : isHover ? "255,255,255" : cyan;
        const pulse = reduce ? 0 : (Math.sin(time * 2 + i) + 1) / 2;
        const alpha = Math.min(1, (p.z + 0.05) * 3);
        ctx.fillStyle = `rgba(${rgb},${0.18 * alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 + pulse * 5 + (isSel ? 5 : 0), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, isSel ? 5.5 : 4, 0, Math.PI * 2); ctx.fill();
        if (labelsRef.current && p.z > 0.15) {
          ctx.font = `600 ${w < 420 ? 11 : 12}px Manrope, system-ui, sans-serif`;
          const tw = ctx.measureText(c.label).width;
          const lx = p.x + 12, ly = p.y - 22;
          ctx.fillStyle = dark ? `rgba(8,14,36,${0.82 * alpha})` : `rgba(255,255,255,${0.9 * alpha})`;
          ctx.strokeStyle = `rgba(${rgb},${0.6 * alpha})`;
          ctx.beginPath(); ctx.roundRect(lx, ly, tw + 16, 22, 11); ctx.fill(); ctx.stroke();
          ctx.fillStyle = dark ? `rgba(230,240,255,${alpha})` : `rgba(12,22,52,${alpha})`;
          ctx.fillText(c.label, lx + 8, ly + 15);
        }
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      if (s.target !== null) {
        s.rot += (s.target - s.rot) * Math.min(1, dt * 4);
        if (Math.abs(s.target - s.rot) < 0.002) s.target = null;
      } else if (!s.drag && !selRef.current) {
        s.rot += dt * 0.12;
      }
      draw(now);
      if (visible) raf = requestAnimationFrame(loop);
    };

    const hit = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1, bd = 22 * 22;
      nodeScreen.forEach((p, i) => {
        if (p.z < 0) return;
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };

    const onDown = (e: PointerEvent) => {
      state.current.drag = { x: e.clientX, rot: state.current.rot, moved: false };
      state.current.target = null;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const s = state.current;
      if (s.drag) {
        const dx = e.clientX - s.drag.x;
        if (Math.abs(dx) > 3) s.drag.moved = true;
        s.rot = s.drag.rot + dx * 0.008;
        if (reduce) draw(performance.now());
      } else {
        const hv = hit(e);
        if (hv !== s.hover) { s.hover = hv; canvas.style.cursor = hv >= 0 ? "pointer" : "grab"; if (reduce) draw(performance.now()); }
      }
    };
    const onUp = (e: PointerEvent) => {
      const s = state.current;
      if (s.drag && !s.drag.moved) {
        const i = hit(e);
        if (i >= 0) onSelectRef.current(CATEGORIES[i].id);
      }
      s.drag = null;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) { last = performance.now(); raf = requestAnimationFrame(loop); }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      role="img"
      aria-label="Illustrative globe showing how humans, businesses, AI agents, suppliers, developers and opportunities could connect on AGENTNEX. Concept only, not live activity."
      data-testid="canvas-globe"
    >
      AGENTNEX ecosystem concept: humans, businesses, AI agents, suppliers, developers and opportunities connected through verified identity.
    </canvas>
  );
}
