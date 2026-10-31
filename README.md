# Kodaros — Mostruário de Landing Pages

[English](README.en.md) · **Português (Brasil)**

**50 páginas de demonstração, cada uma com a identidade visual do seu nicho.**

Projeto publicado no GitHub Pages para mostrar a empresas reais como uma landing page pode ser construída sem template genérico — com paleta própria, tipografia escolhida a dedo e conteúdo escrito para o negócio, não para SEO.

O hub segue a identidade da Kodaros: obsidiana, tinta quente e um único sinal de ouro, com Instrument Serif nos títulos e Figtree no texto. A capa de cada página é um print real do topo dela.

## Estrutura

```
/
├── index.html              ← hub com splash, busca, filtro, grid e viewer
├── assets/
│   ├── css/
│   │   ├── kit.css         ← fundação compartilhada (grid, tipografia, componentes)
│   │   └── hub.css         ← estilo do hub (identidade Kodaros)
│   ├── js/
│   │   └── hub.js          ← lógica do hub (filtro, busca, viewer)
│   ├── data/
│   │   └── sites.js        ← manifesto com as 50 páginas
│   ├── covers/             ← capas 1440×1080 (print do topo de cada página)
│   └── img/                ← bust, favicon e imagem de compartilhamento
├── sites/
│   ├── <slug>/
│   │   ├── index.html      ← página individual
│   │   ├── style.css       ← paleta e layout do nicho
│   │   └── assets/
│   │       ├── mark.svg    ← marca em SVG
│   │       ├── hero.svg    ← arte de abertura
│   │       └── work-*.svg  ← imagens por seção
│   └── … (50 no total)
├── tools/
│   ├── gen-assets.mjs      ← geração determinística de SVGs
│   ├── validate.mjs        ← validador mecânico
│   ├── contrast.mjs        ← auditoria de contraste WCAG AA
│   ├── covers.mjs          ← regenera as capas do mostruário
│   └── serve.mjs           ← servidor de desenvolvimento
└── .nojekyll               ← necessário para GitHub Pages
```

## Como usar

### Servidor local

```bash
node tools/serve.mjs
# abre em http://127.0.0.1:8790/
```

### Validar todas as páginas

```bash
node tools/validate.mjs
# ou específicas:
node tools/validate.mjs estudio-norte saraiva-prado
```

### Auditar contraste (WCAG AA)

Com o servidor local rodando:

```bash
node tools/contrast.mjs
# percorre as 50 páginas + o hub e sai com código 1 se algum texto falhar
```

### Regerar as capas

Depois de mexer no topo de alguma página:

```bash
node tools/covers.mjs
# regrava assets/covers/<slug>.webp (1440×1080) de todas as páginas
```

### GitHub Pages

1. Faça push do repositório
2. No GitHub, Settings → Pages → Source: **Deploy from a branch**, branch `main`, pasta `/ (root)`
3. O `.nojekyll` já está na raiz — o Jekyll não será acionado

## Nichos cobertos

| Categoria | Páginas |
|-----------|---------|
| Alimentação | 9 |
| Educação | 7 |
| Portfólio | 6 |
| Saúde | 5 |
| Varejo | 5 |
| Fitness | 4 |
| Beleza | 3 |
| Tecnologia | 3 |
| Construção | 3 |
| Pets | 2 |
| Serviços | 2 |
| Turismo | 1 |

## Regras

- Nenhuma página usa template pronto
- Nenhum gradiente roxo-azulado, emoji, ou fonte banida
- Nenhum dado inventado como "99% de satisfação" ou "mais de 10 mil clientes"
- Cliente é um negócio real com endereço, preço em reais e cidade
- Skip-link, lang pt-BR, meta description, demo notice e demo chip em todas
- Nenhum rótulo abaixo de 11px; nenhum alvo de toque isolado abaixo de 24px
- Tudo responde em 390px sem rolagem horizontal

---

Criado pela Kodaros para demonstrar trabalho.
