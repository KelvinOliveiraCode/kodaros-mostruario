# Kodaros — Manual de Construção do Mostruário

Cada site em `sites/<slug>/` é uma landing page completa, autêntica, de um nicho
específico. Não é um template com cor trocada. O objetivo é mostrar a empresas que
contratam a Kodaros o que a gente entrega: uma página que respeita o negócio,
fala a língua do nicho e tem personalidade visual própria.

---

## 1. Arquivos

```
sites/<slug>/index.html      a landing page
sites/<slug>/style.css       a folha de estilo da página (tokens + layout do site)
sites/<slug>/assets/         SVG gerados (mark.svg, hero.svg, work-1..N.svg)
```

`index.html` deve linkar **apenas** dois arquivos de estilo:

```html
<link rel="stylesheet" href="../../assets/css/kit.css">
<link rel="stylesheet" href="style.css">
```

O `kit.css` é a base compartilhada (reset, tipografia base, botões, formulários,
footer, utilitários de arte). O `style.css` da página define os tokens e o
layout específico. **Não copie o kit para dentro da página.**

Nenhum JavaScript é necessário, exceto o opcional `script.js` para menu mobile
(uma folha de 30 linhas com toggle de classe). Sem framework, sem CDN de JS.

---

## 2. Tokens obrigatórios

Todo `style.css` começa definindo tokens no `:root`. É o que dá identidade:

```css
:root {
  --k-bg: #f6f1ea;          /* fundo da página, sempre com um tom — nunca #000 ou #fff puros */
  --k-surface: #fdfaf4;     /* cartões e áreas elevadas */
  --k-ink: #2b211c;         /* texto principal */
  --k-accent: #b4553a;      /* cor de marca: CTAs, links, destaques */
  --k-accent-2: #6f7f5f;    /* cor de apoio */
  --k-line: rgba(43,33,28,.14);
  --k-font-display: "Parisienne", cursive;
  --k-font-body: "Karla", sans-serif;
  --k-font-mono: "Azeret Mono", monospace;
  --k-max: 74rem;           /* largura do container */
  --k-gutter: 2.5rem;
  --k-sec-pad: clamp(3.5rem, 7vw, 6.5rem);
  --k-card-radius: 14px;
}
```

Use os valores exatos de `assets/data/sites.js` para o seu slug
(`pal`, `fonts`, `arch`, `sections`, `copy`).

### Fontes

As fontes vêm do Google Fonts. Coloque o `<link>` no `<head>` de cada página:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Parisienne&family=Karla&family=Azeret+Mono&display=swap" rel="stylesheet">
```

Troque pela combinação de `fonts` do seu slug. Cada par foi escolhido para o
nicho: Parisienne para salão, Cormorant Garamond para spa e joalheria, Archivo
Black para lanchonete e tênis, Playfair Display para Padaria e vestibular,
Fraunces para restaurante e marcenaria, Syne para nail art e escola de música,
Newsreader para fotografia e pousada, Chivo para缓冲区/segurança.

**Proibido como fonte de display:** Inter, Roboto, Open Sans, Poppins, Lato,
Montserrat, system-ui, Space Grotesk, Fraunces como reflexo, Instrument Serif.
**Proibido:** título em itálico. Títulos são sempre romanos.

---

## 3. Os 12 arquétipos de layout

Cada site tem um `arch` no manifesto. O arquétipo define a **estrutura**; a
paleta e a fonte definem o **sabor**. Use o esqueleto indicado, mas o conteúdo
tem de ser da seção listada no manifesto.

| arch | Esqueleto |
|------|-----------|
| **A** | Hero em duas colunas (texto à esquerda, arte à direita), seções alternando, galeria no fim |
| **B** | Hero full-bleed escuro com tipografia grande, faixa de logos, conteúdo em coluna única larga |
| **C** | Hero centralizado com imagem de fundo em cartão, grade de 3–4 colunas de produtos/preços |
| **D** | Hero em duas colunas reversed (arte à esquerda), seções de largura alternada, prova social em destaque |
| **E** | Hero centrado, depois um bloco de etapas numeradas (timeline), Pricing, FAQ, CTA final |
| **F** | Layout editorial: sidebar de índice fixo à esquerda, conteúdo à direita, tipografia de revista |
| **G** | Hero centralizado compacto, seções em linhas (não cards), listas com divisores, CTA no rodapé |
| **H** | Hero full-bleed de cor sólida, citações grandes entre seções, mosaico de galeria |
| **I** | Layout de cartaz: tipo enorme, alto contraste, bordas duras, mínimo arredondamento |
| **J** | Hero centrado com blobs suaves, cards arredondados, tom acolhedor, muito respiro |
| **K** | Hero à esquerda com card de preço, conteúdo em cartões com borda, fundo escuro sofisticado |
| **L** | Portfólio: hero enxuto, galeria dominante, trabalhos com legenda e metadados |

Arquétipos 12 combinações. Um site com archetype "J" tem que **parecer** J:
suave, arredondado, com espaço. Um "I" tem que parecer cartaz de rua.

---

## 4. Blocos do kit (use estes, não invente CSS do zero)

O `kit.css` já tem: `.wrap`, `.sec`, `.grid` (+`grid-2/3/4/sidebar`),
`.split`, `.cluster`, `.stack`, `.rule`, `.lede`, `.eyebrow`, `.muted`, `.mono`,
`.btn` (+`--ghost/--sm/--block`), `.link-arrow`, `.card`, `.masthead`, `.nav`,
`.brand`, `.hero` (+`--center/--full`), `.sec__head`, `.prose`, `.list-check`,
`.list-rows`, `.faq`, `.gallery`, `.field`, `.site-footer`, `.demo-chip`,
`.art` (+`--halo/--rings/--dots/--grid/--stack/--slash/--arch/--cone/--grain`),
`.pill`, `.tag`, `.stat`, `.quote`, `.avatar`, `.logo-row`, `.timeline`,
`.marquee`, `.tabs`, `.price`, `.visually-hidden`, `.skip-link`.

A arte do hero e a galeria **não** são fotos: são os SVGs de `assets/`.
Use `<img src="assets/hero.svg" alt="...">` e `assets/work-1.svg` etc.
Assim cada site tem identidade visual própria, sem depender de banco de imagens.

Para ícones, use SVG inline com `stroke="currentColor"` e `fill="none"`.
**Nunca** emoji.

---

## 5. Estrutura obrigatória da página

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Brand — Nicho | City</title>
  <meta name="description" content="blurb do manifesto, em uma linha">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=...&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/css/kit.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <header class="masthead"> ... </header>

  <main id="conteudo">
    <section class="hero"> ... </section>
    ... seções na ordem do manifesto ...
  </main>

  <footer class="site-footer"> ... </footer>

  <a class="demo-chip" href="../../index.html">Voltar ao mostruário</a>
</body>
</html>
```

O `.demo-chip` é obrigatório: avisa que a página é demonstração e leva de volta
ao hub. **Este é o "aviso" que o cliente vê** — deixe-o legível, sem esconder.

### Aviso de demonstração (obrigatório no rodapé)

O rodapé de cada página carrega um aviso explícito, porque estas páginas vão
ser mostradas a empresas que podem acreditar que são sites reais:

```html
<p class="demo-notice">
  Página de demonstração criada pela Kodaros. Nome, endereço, preços e
  depoimentos são fictícios.
</p>
```

E o `style.css` de cada site estiliza `.demo-notice` com o próprio estilo
(mono, pequeno, discreto — mas legível).

---

## 6. Regra de ouro da escrita

O texto é o que separa uma landing page de verdade de um template.

**Cada página precisa de fatos concretos e verificáveis dentro da ficção:**

- Preços reais em reais: "corte a partir de R$ 120", não "preços acessíveis"
- Endereço com bairro e cidade
- Horário de funcionamento, formato de aula, tempo de entrega
- Nomes de pessoas (dono, profissional, cliente) — a página fala de gente
- Detalhe técnico que só alguém do nicho escreveria: "massa de 48 horas",
  "raio-x digital", "fermentação natural", "golden hour das 17h"
- Depoimentos com nome e contexto: "Marta, cliente desde 2021" — nunca "— Cliente satisfeito"

**Proibido, sem exceção:**

- "Solução completa", "experiência única", "transforme seu negócio", "elevate",
  "desbloqueie", "revolucionário", "inovador", "sejam bem-vindos", "sonho",
  "paixão", "dedicação", "experiência", "jornada", "universo", "conexão"
- Números inventados sem base: "+47% de conversão", "50.000 clientes",
  "10x mais rápido", "99,9% de uptime"
- Adjetivos vazios no hero: "o melhor", "líder de mercado", "referência"
- Parágrafo de 4 linhas que não diz nada concreto
- "Sua jornada começa aqui", "Venha fazer parte"

**Estrutura de hero que funciona:**

```
[eyebrow opcional]  — no máximo 1 a cada 3 seções, nunca em todas
[H1: promessa concreta do nicho, em até 8 palavras]
[lede: 1 ou 2 frases com fato real]
[CTA principal] [CTA secundário]  — um destino, uma ação
```

H1 bom: "Corte e cor com ficha técnica do seu fio"
H1 ruim: "Transformando sua jornada de beleza"

**Português do Brasil, de gente.** Escreva como quem escreve para o próprio
negócio, não como quem escreve para uma marca global. Frases de tamanho
variado. Sem voz passiva decorativa. Sem advérbio empolado.

---

## 7. Regras visuais (anti-slop)

**Proibido, com ou sem aviso:**

- Gradiente roxo→azul, roxo→ciano, azul→magenta, laranja→rosa
- Gradiente no texto (`background-clip: text`)
- Bolhas flutuantes, blobs animados, aurora, mesh gradient
- Onda SVG decorativa separando seções
- `#000` ou `#fff` puros como fundo ou tinta
- Grade de 3 cards com ícone em círculo colorido + título + descrição (o grid de recursos de IA)
- Hero de 100vh com tudo centralizado
- Moldura de celular, barra de navegador, janela de terminal desenhada em div, dashboard falso
- Emoji como ícone, marcador ou bullet
- Cartão dentro de cartão
- Ícone, título, descrição repetidos em três cards iguais
- Nav padrão (logo à esquerda, links no meio, CTA à direita, borda embaixo) + rodapé de quatro colunas de links + fileira de ícones de rede social
- Eyebrow em toda seção
- Cartão com borda esquerda de 3px colorida decorativa
- Cantos arredondados iguais e enormes (>=32px) em tudo
- Sombra suave grande (blur >=16px) com borda de 1px
- Números gigantes decorativos com "empresas que confiam"
- "Rolar para explorar" e setinhas pulsando

**Obrigatório:**

- Um display font com personalidade (do manifesto) e um body font legível
- Contraste de texto real: texto pequeno sobre fundo tem que ler
- Alinhamento: uma grade consistente, não tudo centrado
- Ritmo: seções com alturas diferentes, não todas iguais
- Um elemento visual que só aquele site tem

---

## 8. Acessibilidade e performance

- `lang="pt-BR"`, `<title>` descritivo, `<meta name="description">`
- Hierarquia de headings correta: um `<h1>`, `<h2>` por seção
- `<nav aria-label="Principal">`, `<main id="conteudo">`
- `.skip-link` presente
- Contraste mínimo 4.5:1 para texto de corpo
- Alvos de clique com 44px de altura mínima
- `focus-visible` não removido
- `prefers-reduced-motion` respeitado
- SVGs com `alt` descritivo ou `aria-hidden="true"` se decorativos
- Nenhuma imagem acima de 30 KB (nossos SVGs são pequenos)
- `width`/`height` nos `<img>` para evitar layout shift

---

## 9. Checklist antes de entregar

- [ ] Abri a página no navegador e ela renderiza sem erro de console
- [ ] Funciona em 375px, 768px e 1440px
- [ ] Nenhum texto genérico do manifesto de proibidos
- [ ] Tem preço, endereço/bairro, nome de pessoa, horário
- [ ] `.demo-chip` e `.demo-notice` presentes
- [ ] Título sem itálico
- [ ] Nenhum emoji
- [ ] Nenhum gradiente roxo-azul
- [ ] A página parece pertencer ao nicho, não a um template
- [ ] `style.css` define tokens no `:root` e não copia o kit
- [ ] A arte usa os SVGs de `assets/`
