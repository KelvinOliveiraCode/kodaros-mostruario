/* Verificação temporária de overflow horizontal nas quatro páginas.
   Uso: node sites/alvorada/__overflow-check.mjs   (apagar depois) */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = "C:/Users/Kelvin/Documents/deepseek-harness/default-workspace/kodaros-landing/sites";
const slugs = ["alvorada", "escola-fala", "notas-escola", "linha-certa"];
const widths = [375, 768, 1440];
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const inject = `<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const w = document.documentElement.clientWidth;
    const out = [];
    const clipped = (el) => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
        p = p.parentElement;
      }
      return false;
    };
    document.querySelectorAll('body *').forEach((el) => {
      if (clipped(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > w + 1 || r.left < -1)) {
        const cls = typeof el.className === 'string' ? el.className : '';
        out.push(el.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\\s+/).join('.') : '') + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      }
    });
    const pre = document.createElement('pre');
    pre.id = 'kodaros-report';
    pre.textContent = JSON.stringify({ vw: w, sw: document.documentElement.scrollWidth, n: out.length, over: out.slice(0, 8) });
    document.body.appendChild(pre);
  }, 400);
});
</script>`;

for (const slug of slugs) {
  const src = readFileSync(join(root, slug, "index.html"), "utf8");
  const tmp = join(root, slug, "__check.html");
  writeFileSync(tmp, src.replace("</body>", inject + "</body>"), "utf8");
  for (const w of widths) {
    let dom = "";
    try {
      dom = execFileSync(
        chrome,
        ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
         "--window-size=" + w + ",900", "--virtual-time-budget=5000", "--dump-dom",
         "file:///" + tmp.replace(/\\/g, "/")],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
      );
    } catch (e) {
      console.log(slug, w, "CHROME ERROR", String(e).slice(0, 200));
      continue;
    }
    const m = dom.match(/<pre id="kodaros-report">([\s\S]*?)<\/pre>/);
    console.log(slug.padEnd(13), String(w).padStart(4), m ? m[1] : "NO REPORT");
  }
  unlinkSync(tmp);
}
