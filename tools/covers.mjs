// tools/covers.mjs — gera as capas do mostruário a partir do print do topo de cada página.
//
// Uso:
//   node tools/serve.mjs          (em outro terminal)
//   node tools/covers.mjs         (regenera as 50 capas em assets/covers/)
//
// Cada capa é 1440x1080 (4:3), webp, com o chip de navegação escondido.

import { spawn } from "node:child_process";
import { readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const BASE = process.env.KODAROS_BASE || "http://127.0.0.1:8790";
const OUT = join(ROOT, "assets", "covers");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9341;

mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(process.env.TEMP || "/tmp", "kodaros-covers")}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
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
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false
});

const slugs = readdirSync(join(ROOT, "sites"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "sites", d.name, "index.html")))
  .map((d) => d.name)
  .sort();

let ok = 0;
for (const slug of slugs) {
  await send("Page.navigate", { url: `${BASE}/sites/${slug}/` });
  await sleep(1100);
  await send("Runtime.evaluate", {
    expression: `(async () => {
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
      const s = document.createElement('style');
      s.textContent = '.demo-chip{display:none!important}.skip-link{display:none!important}';
      document.head.appendChild(s);
      await Promise.all(Array.from(document.images).filter(i => i.getBoundingClientRect().top < 1200).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    })()`,
    awaitPromise: true
  });
  await sleep(250);
  const r = await send("Page.captureScreenshot", { format: "webp", quality: 82 });
  writeFileSync(join(OUT, slug + ".webp"), Buffer.from(r.data, "base64"));
  ok++;
  if (ok % 10 === 0) console.log(`${ok}/${slugs.length}`);
}

console.log(`capas: ${ok}/${slugs.length} em assets/covers/`);
ws.close();
chrome.kill();
