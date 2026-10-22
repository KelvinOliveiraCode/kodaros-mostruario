/* Validador do mostruário Kodaros.
   Uso:
     node tools/validate.mjs                -> valida as 50
     node tools/validate.mjs slug1 slug2     -> valida só essas

   Sai com código 1 se qualquer página falhar. Cada falha vira uma linha
   "slug  [regra]  detalhe". Saída vazia + "OK" = página entregue. */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- manifesto -------------------------------------------------------------
const sandbox = {};
new Function("window", readFileSync(join(root, "assets/data/sites.js"), "utf8"))(sandbox);
const SITES = sandbox.KODAROS_SITES;

const only = process.argv.slice(2);
const targets = only.length ? SITES.filter((s) => only.includes(s.slug)) : SITES;

if (only.length) {
  const missing = only.filter((s) => !SITES.some((x) => x.slug === s));
  if (missing.length) console.error("slug fora do manifesto: " + missing.join(", "));
}

// --- regras de escrita -----------------------------------------------------
const BANNED_PHRASES = [
  "solução completa", "soluções completas", "experiência única", "experiências únicas",
  "transforme sua", "transforme seu", "elevate", "revolucionário", "revolucionária",
  "inovador", "inovadora", "sonho de", "seu sonho", "nossa paixão", "paixão por",
  "dedicação total", "jornada", "sejam bem-vindos", "bem-vindo ao futuro",
  "líder de mercado", "estado da arte", "sinergia", "disruptivo", "game changer",
  "eleve seu", "leve seu negócio", "próximo nível", "unlock", "empower",
  "no mundo de hoje", "nos dias de hoje", "cada vez mais", "não é apenas"
];

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const PURE_BW = /#(?:000000|000|ffffff|fff)\b/i;

const problems = [];

function fail(slug, rule, detail) {
  problems.push({ slug, rule, detail });
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function rootBlock(css) {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/);
  return m ? m[1] : "";
}

function token(block, name) {
  const m = block.match(new RegExp("--" + name + "\\s*:\\s*([^;]+);"));
  return m ? m[1].trim() : null;
}

function normHex(v) {
  if (!v) return null;
  const m = v.trim().match(/^#([0-9a-f]{6})$/i);
  return m ? "#" + m[1].toLowerCase() : null;
}

for (const site of targets) {
  const dir = join(root, "sites", site.slug);
  const htmlPath = join(dir, "index.html");
  const cssPath = join(dir, "style.css");

  if (!existsSync(htmlPath)) { fail(site.slug, "arquivo", "falta index.html"); continue; }
  if (!existsSync(cssPath)) { fail(site.slug, "arquivo", "falta style.css"); continue; }

  const html = readFileSync(htmlPath, "utf8");
  const cssRaw = readFileSync(cssPath, "utf8");
  const css = stripComments(cssRaw);

  // --- obrigatórios -------------------------------------------------------
  if (!html.includes("demo-chip")) fail(site.slug, "aviso", "sem .demo-chip");
  if (!html.includes("demo-notice")) fail(site.slug, "aviso", "sem .demo-notice");
  if (!/href="\.\.\/\.\.\/index\.html"/.test(html)) fail(site.slug, "aviso", "demo-chip não aponta para ../../index.html");
  if (!css.includes(".demo-notice")) fail(site.slug, "aviso", ".demo-notice sem estilo");

  if (!/lang="pt-BR"/.test(html)) fail(site.slug, "html", "sem lang=pt-BR");
  if (!/<meta name="description"/.test(html)) fail(site.slug, "html", "sem meta description");
  if (!/skip-link/.test(html)) fail(site.slug, "a11y", "sem skip-link");
  if (!/kit\.css/.test(html)) fail(site.slug, "html", "não linka kit.css");

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(site.slug, "html", `${h1} h1 (esperado 1)`);

  // --- anti-slop visual ---------------------------------------------------
  // O bloco :root é ditado pelo manifesto (paleta de cada nicho), então fica de
  // fora das proibições de cor — a regra vale para o que a página desenha.
  const cssBody = css.replace(/:root\s*\{[\s\S]*?\}/g, "");
  if (/font-style\s*:\s*italic/i.test(css)) fail(site.slug, "estilo", "font-style: italic");
  if (/<i[\s>]/i.test(html)) fail(site.slug, "estilo", "tag <i>");
  if (EMOJI.test(html)) fail(site.slug, "estilo", "emoji no HTML");
  if (PURE_BW.test(cssBody)) fail(site.slug, "estilo", "#000/#fff puro fora do :root");
  if (/linear-gradient\([^)]*(purple|#7c3aed|#8b5cf6|#6366f1)/i.test(cssBody)) fail(site.slug, "estilo", "gradiente roxo");

  // headings em itálico
  const headingItalic = /h[1-4][^{]*\{[^}]*font-style\s*:\s*italic/i.test(css);
  if (headingItalic) fail(site.slug, "estilo", "heading em itálico");

  // --- texto --------------------------------------------------------------
  const lowHtml = html.toLowerCase().replace(/<[^>]+>/g, " ");
  for (const p of BANNED_PHRASES) {
    if (lowHtml.includes(p)) fail(site.slug, "texto", `frase banida: "${p}"`);
  }

  // --- tokens do manifesto ------------------------------------------------
  const block = rootBlock(css);
  if (!block) fail(site.slug, "token", "sem bloco :root");

  const palMap = { bg: "bg", sfc: "surface", ink: "ink", acc: "accent", acc2: "accent-2" };
  for (const [key, name] of Object.entries(palMap)) {
    const want = normHex(site.pal[key]);
    const got = normHex(token(block, "k-" + name));
    if (!got) fail(site.slug, "token", `--k-${name} ausente ou inválido`);
    else if (want && got !== want) fail(site.slug, "token", `--k-${name}=${got} (manifesto: ${want})`);
  }
  for (const fam of ["display", "body", "mono"]) {
    const got = token(block, "k-font-" + fam);
    const want = site.fonts[fam];
    if (!got) fail(site.slug, "token", `--k-font-${fam} ausente`);
    else if (!got.toLowerCase().includes(want.toLowerCase())) {
      fail(site.slug, "token", `--k-font-${fam} não usa "${want}"`);
    }
  }

  // --- referências locais existem ----------------------------------------
  const refs = [
    ...html.matchAll(/(?:src|href)="([^"#:]+\.(?:svg|css|js|png|jpg|webp))"/g)
  ].map((m) => m[1]);

  for (const ref of refs) {
    if (ref.startsWith("http") || ref.startsWith("data:") || ref.startsWith("mailto:") || ref.startsWith("tel:")) continue;
    const target = ref.startsWith("/") ? join(root, ref) : resolve(dir, ref);
    if (!existsSync(target)) fail(site.slug, "referência", `não existe: ${ref}`);
  }

  // --- assets declarados existem mas não usados --------------------------
  const assetDir = join(dir, "assets");
  if (existsSync(assetDir)) {
    const files = readdirSync(assetDir);
    if (!files.includes("hero.svg")) fail(site.slug, "asset", "falta hero.svg");
    if (!html.includes("assets/hero.svg") && !css.includes("assets/hero.svg")) {
      fail(site.slug, "asset", "hero.svg gerado mas não usado");
    }
  }

  // --- proibições de conteúdo --------------------------------------------
  if (/<iframe/i.test(html) && !/viewer/i.test(html)) fail(site.slug, "html", "iframe na página");
}

// --- relatório -------------------------------------------------------------
if (!problems.length) {
  console.log(`${targets.length} página(s) OK`);
  process.exit(0);
}

for (const p of problems) console.log(`${p.slug}  [${p.rule}]  ${p.detail}`);
console.log(`\n${problems.length} problema(s) em ${new Set(problems.map((p) => p.slug)).size} página(s)`);
process.exit(1);
