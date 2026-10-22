/* Kodaros Landing — gerador de assets por site.
   Cada site recebe marca, arte de hero e peças de portfólio em SVG próprio,
   geradas a partir do slug (semente estável) e da paleta do manifesto.
   Uso: node tools/gen-assets.mjs [slug...]           */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = readFileSync(join(root, "assets/data/sites.js"), "utf8");
const scope = { window: {} };
new Function("window", manifest)(scope.window);
const SITES = scope.window.KODAROS_SITES;

/* ------------------------------------------------------------ semente */

function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, a, b) => a + r() * (b - a);
const round = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------- helpers */

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amt > 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("");
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((sh) => {
    const va = (pa >> sh) & 255, vb = (pb >> sh) & 255;
    return Math.round(va + (vb - va) * t);
  });
  return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
}

/* --------------------------------------------------------- composição */

const SCENES = {
  arch(r, p, w, h) {
    const layers = 3 + Math.floor(r() * 3);
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    for (let i = layers; i > 0; i--) {
      const t = i / layers;
      const inset = (w * 0.16) * i;
      const top = h * 0.18 * (1 - i * 0.06);
      const c = i % 2 ? p.acc : p.acc2;
      out += `<path d="M ${round(inset)} ${h} L ${round(inset)} ${round(top + (w - inset * 2) / 2)} A ${round((w - inset * 2) / 2)} ${round((w - inset * 2) / 2)} 0 0 1 ${round(w - inset)} ${round(top + (w - inset * 2) / 2)} L ${round(w - inset)} ${h} Z" fill="${c}" opacity="${round(0.28 + t * 0.42)}"/>`;
    }
    return out;
  },

  rings(r, p, w, h) {
    const cx = w * between(r, 0.34, 0.66), cy = h * between(r, 0.38, 0.62);
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const n = 7 + Math.floor(r() * 6);
    for (let i = n; i > 0; i--) {
      const rad = (Math.min(w, h) * 0.62 * i) / n;
      out += `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(rad)}" fill="none" stroke="${i % 3 === 0 ? p.acc : i % 3 === 1 ? p.acc2 : p.ink}" stroke-width="${round(between(r, 1.5, 6))}" opacity="${round(between(r, 0.25, 0.85))}"/>`;
    }
    out += `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(Math.min(w, h) * 0.07)}" fill="${p.acc}"/>`;
    return out;
  },

  strata(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    let y = 0;
    const bands = 5 + Math.floor(r() * 5);
    for (let i = 0; i < bands; i++) {
      const bh = (h / bands) * between(r, 0.6, 1.5);
      const c = [p.acc, p.acc2, p.ink, mix(p.acc, p.ink, 0.5)][Math.floor(r() * 4)];
      const skew = between(r, -0.18, 0.18) * w;
      out += `<path d="M 0 ${round(y)} L ${w} ${round(y + skew)} L ${w} ${round(y + bh)} L 0 ${round(y + bh + skew * 0.4)} Z" fill="${c}" opacity="${round(between(r, 0.35, 0.9))}"/>`;
      y += bh * between(r, 0.55, 0.9);
      if (y > h) break;
    }
    return out;
  },

  facets(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const cols = 3 + Math.floor(r() * 3), rows = 3 + Math.floor(r() * 3);
    const cw = w / cols, ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (r() < 0.24) continue;
        const c = [p.acc, p.acc2, p.ink, mix(p.art, p.acc, 0.35)][Math.floor(r() * 4)];
        const px = x * cw, py = y * ch;
        const split = between(r, 0.2, 0.8);
        out += `<rect x="${round(px)}" y="${round(py)}" width="${round(cw)}" height="${round(ch)}" fill="${c}" opacity="${round(between(r, 0.2, 0.75))}"/>`;
        if (r() < 0.4) {
          out += `<path d="M ${round(px)} ${round(py)} L ${round(px + cw * split)} ${round(py)} L ${round(px)} ${round(py + ch * split)} Z" fill="${shade(p.art, 0.14)}" opacity="0.7"/>`;
        }
      }
    }
    return out;
  },

  wave(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const layers = 4 + Math.floor(r() * 4);
    for (let i = 0; i < layers; i++) {
      const y = h * (0.28 + (i / layers) * 0.66);
      const amp = h * between(r, 0.05, 0.16);
      const c = i % 2 ? p.acc : p.acc2;
      let d = `M 0 ${round(y)}`;
      const steps = 5;
      for (let s = 1; s <= steps; s++) {
        const x0 = (w * (s - 1)) / steps, x1 = (w * s) / steps;
        const dir = s % 2 ? -1 : 1;
        d += ` Q ${round((x0 + x1) / 2)} ${round(y + amp * dir)} ${round(x1)} ${round(y)}`;
      }
      d += ` L ${w} ${h} L 0 ${h} Z`;
      out += `<path d="${d}" fill="${c}" opacity="${round(0.24 + (i / layers) * 0.5)}"/>`;
    }
    return out;
  },

  orbit(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const cx = w * between(r, 0.4, 0.6), cy = h * between(r, 0.42, 0.58);
    const n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const rad = Math.min(w, h) * between(r, 0.16, 0.46);
      const c = [p.acc, p.acc2, p.ink][Math.floor(r() * 3)];
      out += `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(rad)}" fill="none" stroke="${c}" stroke-width="${round(between(r, 2, 9))}" opacity="${round(between(r, 0.3, 0.8))}" transform="rotate(${round(between(r, 0, 180))} ${round(cx)} ${round(cy)})"/>`;
      const a = between(r, 0, Math.PI * 2);
      out += `<circle cx="${round(cx + Math.cos(a) * rad)}" cy="${round(cy + Math.sin(a) * rad)}" r="${round(between(r, 5, 18))}" fill="${p.acc}"/>`;
    }
    return out;
  },

  stack(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const n = 4 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const bw = w * between(r, 0.32, 0.74), bh = h * between(r, 0.16, 0.4);
      const x = between(r, 0, w - bw), y = between(r, 0, h - bh);
      const c = [p.acc, p.acc2, p.ink][Math.floor(r() * 3)];
      out += `<rect x="${round(x)}" y="${round(y)}" width="${round(bw)}" height="${round(bh)}" fill="${c}" opacity="${round(between(r, 0.28, 0.82))}" transform="rotate(${round(between(r, -6, 6))} ${round(x + bw / 2)} ${round(y + bh / 2)})"/>`;
    }
    return out;
  },

  halftone(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const step = Math.min(w, h) / between(r, 9, 16);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const t = 1 - Math.hypot(x - w * 0.35, y - h * 0.4) / (Math.hypot(w, h) * 0.7);
        const rad = Math.max(0, step * 0.42 * t);
        if (rad < 0.4) continue;
        out += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(rad)}" fill="${r() < 0.25 ? p.acc2 : p.acc}" opacity="${round(between(r, 0.4, 0.95))}"/>`;
      }
    }
    return out;
  },

  contour(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const n = 16 + Math.floor(r() * 12);
    const amp = h * between(r, 0.05, 0.13);
    for (let i = 0; i < n; i++) {
      const y = (h / n) * i + between(r, -6, 6);
      const c = i % 5 === 0 ? p.acc : i % 5 === 2 ? p.acc2 : p.ink;
      let d = `M 0 ${round(y)}`;
      for (let s = 1; s <= 6; s++) {
        const x0 = (w * (s - 1)) / 6, x1 = (w * s) / 6;
        d += ` Q ${round((x0 + x1) / 2)} ${round(y + amp * (s % 2 ? 1 : -1))} ${round(x1)} ${round(y)}`;
      }
      out += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${round(between(r, 1.4, 4.2))}" opacity="${round(between(r, 0.3, 0.85))}"/>`;
    }
    return out;
  },

  bars(r, p, w, h) {
    let out = `<rect width="${w}" height="${h}" fill="${p.art}"/>`;
    const n = 8 + Math.floor(r() * 10);
    const gap = w / n;
    for (let i = 0; i < n; i++) {
      const bh = h * between(r, 0.12, 0.92);
      const c = [p.acc, p.acc2, p.ink][Math.floor(r() * 3)];
      out += `<rect x="${round(i * gap + gap * 0.16)}" y="${round(h - bh)}" width="${round(gap * 0.68)}" height="${round(bh)}" fill="${c}" opacity="${round(between(r, 0.35, 0.92))}"/>`;
    }
    return out;
  }
};

const SCENE_KEYS = Object.keys(SCENES);

/* -------------------------------------------------------------- marca */

function mark(r, p, slug) {
  const s = 64;
  const kind = slug.length % 4;
  let body = "";
  if (kind === 0) {
    const off = between(r, 6, 14);
    body = `<rect x="6" y="6" width="${round(s - 12 - off)}" height="${round(s - 12)}" fill="${p.acc}"/><rect x="${round(6 + off + 4)}" y="${round(6 + off * 0.4)}" width="${round(s - 12 - off - 4)}" height="${round(s - 12 - off * 0.4)}" fill="${p.bg}"/>`;
  } else if (kind === 1) {
    body = `<circle cx="32" cy="32" r="26" fill="none" stroke="${p.acc}" stroke-width="7"/><path d="M 32 6 A 26 26 0 0 1 58 32 L 32 32 Z" fill="${p.acc2}"/>`;
  } else if (kind === 2) {
    const d = between(r, 18, 26);
    body = `<rect x="8" y="8" width="${round(s - 16)}" height="${round(s - 16)}" fill="${p.acc}" transform="rotate(45 32 32)"/><circle cx="32" cy="32" r="${round(d / 2)}" fill="${p.bg}"/>`;
  } else {
    body = `<path d="M 10 54 L 32 10 L 54 54 Z" fill="${p.acc}"/><path d="M 22 54 L 32 34 L 42 54 Z" fill="${p.bg}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" role="img" aria-label="Marca"><rect width="${s}" height="${s}" fill="${p.bg}"/>${body}</svg>`;
}

/* --------------------------------------------------------------- svg */

function sceneSvg(inner, w, h, p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>Composição abstrata</title>${inner}</svg>`;
}

function grainOverlay(w, h) {
  return `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${w}" height="${h}" filter="url(#g)" opacity="0.16" style="mix-blend-mode:overlay"/>`;
}

/* --------------------------------------------------------------- main */

const wanted = process.argv.slice(2);
const targets = wanted.length ? SITES.filter((s) => wanted.includes(s.slug)) : SITES;

for (const site of targets) {
  const seed = seedOf(site.slug);
  const dir = join(root, "sites", site.slug, "assets");
  mkdirSync(dir, { recursive: true });
  const p = site.pal;

  writeFileSync(join(dir, "mark.svg"), mark(rng(seed ^ 0x9e37), p, site.slug), "utf8");

  const heroScene = SCENE_KEYS[seed % SCENE_KEYS.length];
  const heroR = rng(seed ^ 0x51ed);
  const hw = 1200, hh = 900;
  writeFileSync(
    join(dir, "hero.svg"),
    sceneSvg(SCENES[heroScene](heroR, p, hw, hh) + grainOverlay(hw, hh), hw, hh, p),
    "utf8"
  );

  const workCount = 4 + (seed % 3);
  for (let i = 0; i < workCount; i++) {
    const r = rng(seed ^ (0x1000 * (i + 3)));
    const key = SCENE_KEYS[(seed + i * 3) % SCENE_KEYS.length];
    const vertical = i % 2 === 0;
    const w = vertical ? 900 : 1200;
    const h = vertical ? 1200 : 900;
    writeFileSync(
      join(dir, `work-${i + 1}.svg`),
      sceneSvg(SCENES[key](r, p, w, h) + grainOverlay(w, h), w, h, p),
      "utf8"
    );
  }

  console.log("ok", site.slug);
}

console.log(`\n${targets.length} sites processados.`);
