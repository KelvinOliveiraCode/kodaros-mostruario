# Kodaros Landing — Mostruário de Landing Pages

**50 páginas de demonstração, cada uma com a identidade visual do seu nicho.**

Projeto publicado no GitHub Pages para mostrar a empresas reais como uma landing page pode ser construída sem template genérico — com paleta própria, tipografia escolhida a dedo e conteúdo escrito para o negócio, não para SEO.

## Estrutura

```
/
├── index.html              ← hub com splash, busca, filtro e grid
├── assets/
│   ├── css/
│   │   ├── kit.css         ← fundação compartilhada (grid, tipografia, componentes)
│   │   └── hub.css         ← estilo do hub
│   ├── js/
│   │   └── hub.js          ← lógica do hub (filtro, busca, viewer)
│   └── data/
│       └── sites.js        ← manifesto com as 50 páginas
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

### GitHub Pages

1. Faça push do repositório
2. No GitHub, Settings → Pages → Source: **Deploy from a branch**, branch `main`, pasta `/ (root)`
3. O `.nojekyll` já está na raiz — o Jekyll não será acionado

## Nichos cobertos

| Categoria | Páginas |
|-----------|---------|
| Beleza | 6 |
| Fitness | 5 |
| Alimentação | 6 |
| Saúde | 5 |
| Pets | 3 |
| Educação | 4 |
| Portfólio | 4 |
| Serviços | 6 |
| Tecnologia | 3 |
| Varejo | 4 |
| Construção | 2 |
| Turismo | 2 |

## Regras

- Nenhuma página usa template pronto
- Nenhum gradiente roxo-azulado, emoji, ou fonte banida
- Nenhum dado inventado como "99% de satisfação" ou "mais de 10 mil clientes"
- Cliente é um negócio real com endereço, preço em reais e cidade
- Skip-link, lang pt-BR, meta description, demo notice e demo chip em todas

---

Criado pela Kodaros para demonstrar trabalho.