// Mede caixas de elementos suspeitos nas 4 páginas.
import { spawn } from "node:child_process";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9334;
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(process.env.TEMP, "kodaros-chrome-profile2")}`,
  "--hide-scrollbars", "--no-first-run", "about:blank",
], { stdio: "ignore" });

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
  throw new Error("sem CDP");
})();

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id; pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const probes = {
  "personal-rafael": ["#metodo .steps > li", "#metodo .steps h3", "#metodo .steps p", ".rn-metodo", "#metodo .steps", ".hero__art .rn-shot img", "#plano .rn-weeks", ".rn-week"],
  "nova-luz-yoga": [".nl-figure img", ".nl-breath__ring", ".nl-aulas", ".nl-card", "#agenda .nl-schedule", ".nl-voice--big"],
  "casa-boa": [".cb-hero__art img", ".cb-menu", ".cb-mosaic img", ".cb-rows__text"],
  "forno-lento": [".fl-hero__card", ".fl-hero__bg", ".fl-grid", ".fl-pizza", ".fl-steps p", ".fl-steps > li", ".fl-timeline"],
};

for (const [slug, sels] of Object.entries(probes)) {
  await send("Page.navigate", { url: `http://127.0.0.1:8790/sites/${slug}/` });
  await sleep(1600);
  const r = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `JSON.stringify(${JSON.stringify(sels)}.map(s => {
      const el = document.querySelector(s);
      if (!el) return s + ' :: AUSENTE';
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return s + '  ' + Math.round(b.width) + 'x' + Math.round(b.height)
        + '  x=' + Math.round(b.x) + ' y=' + Math.round(b.y)
        + '  cols=' + cs.gridTemplateColumns + '  maxw=' + cs.maxWidth;
    }))`,
  });
  console.log("== " + slug);
  for (const line of JSON.parse(r.result.value)) console.log("   " + line);
}

ws.close(); chrome.kill();
