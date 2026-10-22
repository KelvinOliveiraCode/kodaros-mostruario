// tools/contrast.mjs — auditoria de contraste WCAG AA nas 50 páginas + hub.
//
// Uso:
//   node tools/serve.mjs          (em outro terminal)
//   node tools/contrast.mjs
//
// Percorre cada elemento com texto, compõe os fundos ancestrais (incluindo alfa)
// e compara com o mínimo AA: 4.5:1 para texto normal, 3:1 para texto grande.
// Sai com código 1 se houver qualquer falha.

import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const BASE = process.env.KODAROS_BASE || "http://127.0.0.1:8790";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9338;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(process.env.TEMP || "/tmp", "kodaros-contrast")}`,
    "--hide-scrollbars",
    "--no-first-run",
    "about:blank"
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await (async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === "page");
      if (p) return p;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome/Edge não abriu o CDP. Defina CHROME_PATH.");
})();

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = j;
});
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 2400,
  deviceScaleFactor: 1,
  mobile: false
});

const expr = `(() => {
  const parse = (s) => { if (!s || s === 'transparent') return { r:0,g:0,b:0,a:0 };
    const m = s.match(/rgba?\\\\(([^)]+)\\\\)/); if (!m) return { r:0,g:0,b:0,a:0 };
    const p = m[1].split(',').map(Number); return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 }; };
  const lin = (c) => { c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const L = (c) => 0.2126*lin(c.r) + 0.7152*lin(c.g) + 0.0722*lin(c.b);
  const over = (fg, bg) => ({ r: fg.r*fg.a + bg.r*(1-fg.a), g: fg.g*fg.a + bg.g*(1-fg.a), b: fg.b*fg.a + bg.b*(1-fg.a), a: 1 });
  const ratio = (a,b) => { const l1=L(a), l2=L(b), hi=Math.max(l1,l2), lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); };
  const sel = (el) => { if (el.id) return '#'+el.id; const c = el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\\\\s+/).slice(0,2).join('.') : ''; return el.tagName.toLowerCase()+c; };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    let txt = '';
    for (const n of el.childNodes) if (n.nodeType === 3) txt += n.nodeValue;
    txt = txt.replace(/\\\\s+/g,' ').trim();
    if (!txt || txt.length < 2) continue;
    let chain = [];
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = parse(getComputedStyle(cur).backgroundColor);
      if (bg.a > 0) chain.push(bg);
      cur = cur.parentElement;
    }
    const htmlBg = parse(getComputedStyle(document.documentElement).backgroundColor);
    chain.push(htmlBg.a > 0 ? htmlBg : { r:255,g:255,b:255,a:1 });
    let bg = chain[chain.length-1];
    for (let i = chain.length-2; i >= 0; i--) bg = over(chain[i], bg);
    const fg = parse(cs.color);
    const cr = ratio(fg, bg);
    const fs = parseFloat(cs.fontSize);
    const fw = parseInt(cs.fontWeight) || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const need = large ? 3 : 4.5;
    if (cr < need) out.push({ sel: sel(el), text: txt.slice(0, 60), ratio: Math.round(cr*100)/100, need, fs: Math.round(fs*10)/10, fw, color: cs.color, bg: 'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')' });
  }
  return JSON.stringify(out);
})()`;

const targets = readdirSync(join(ROOT, "sites"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "sites", d.name, "index.html")))
  .map((d) => d.name)
  .sort();

let total = 0;
let pages = 0;

async function check(slug, url) {
  await send("Page.navigate", { url });
  await sleep(slug ? 900 : 1200);
  try {
    const r = await send("Runtime.evaluate", { returnByValue: true, expression: expr });
    const fails = JSON.parse(r.result.value);
    if (!fails.length) return;
    pages++;
    total += fails.length;
    console.log(`\n### ${slug || "(hub)"} — ${fails.length} falha(s)`);
    for (const f of fails.slice(0, 10))
      console.log(
        `   ${f.ratio}:1 (mín ${f.need}) ${f.sel} "${f.text}" ${f.color} on ${f.bg} ${f.fs}px/${f.fw}`
      );
    if (fails.length > 10) console.log(`   … +${fails.length - 10}`);
  } catch (e) {
    console.log(`### ${slug} ERRO ${e.message.slice(0, 80)}`);
  }
}

for (const slug of targets) await check(slug, `${BASE}/sites/${slug}/`);
await check("", `${BASE}/`);

console.log(
  `\n=== ${targets.length + 1} páginas, ${pages} com falhas, ${total} falhas no total ===`
);

ws.close();
chrome.kill();

if (total > 0) process.exitCode = 1;
