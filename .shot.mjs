// Screenshot das 4 landing pages via Chrome headless + CDP (sem dependências).
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const OUT = process.env.SHOT_DIR || join(process.env.TEMP, "kodaros-shots");
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(process.env.TEMP, "kodaros-chrome-profile")}`,
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--font-render-hinting=none",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("CDP não respondeu");
}

const page = await targets();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
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

const pages = [
  ["personal-rafael", "/sites/personal-rafael/"],
  ["nova-luz-yoga", "/sites/nova-luz-yoga/"],
  ["casa-boa", "/sites/casa-boa/"],
  ["forno-lento", "/sites/forno-lento/"],
];
const widths = [375, 768, 1440];
const report = [];

for (const [slug, path] of pages) {
  for (const width of widths) {
    await send("Emulation.setDeviceMetricsOverride", {
      width, height: 900, deviceScaleFactor: 1, mobile: width < 700,
    });
    await send("Page.navigate", { url: `http://127.0.0.1:8790${path}` });
    await sleep(2000);
    const probe = await send("Runtime.evaluate", {
      expression: `(() => {
        const d = document.documentElement;
        const wide = [...document.querySelectorAll('body *')]
          .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 6)
          .map(el => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
        return JSON.stringify({
          scrollW: d.scrollWidth, innerW: innerWidth,
          scrollH: d.scrollHeight, wide,
          fonts: document.fonts.status,
          h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 60)
        });
      })()`,
      returnByValue: true,
    });
    const info = JSON.parse(probe.result.value);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: Math.min(info.scrollH, 9000), scale: 1 },
    });
    const file = join(OUT, `${slug}-${width}.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    report.push({ slug, width, ...info, file });
    console.log(`${slug} ${width}px  scrollW=${info.scrollW}/${info.innerW}  h=${info.scrollH}  overflow=${info.scrollW > info.innerW ? "SIM " + info.wide.join(",") : "nao"}  fonts=${info.fonts}`);
  }
}

ws.close();
chrome.kill();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\nshots em " + OUT);
