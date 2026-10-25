# Design

## Context

O app é um static site de 3 arquivos (`index.html`, `style.css`, `script.js`) com comportamento completo já verificado (36/36 em `memo-flash-svg`): renderização SVG `500×320` com gradiente/padrão, `renderTextBlock` guiado por constantes (`TEXT_X`, `TEXT_TOP`, `TEXT_BOTTOM`, `TEXT_MAX_WIDTH`), medidor `progressFill` com largura contínua, `svgEl` com allowlist `{tspan, circle, g}`, partículas via CSSOM (`--tx/--ty/--delay`), CSP local-only + Trusted Types que **bloqueia atributo `style=` em markup** mas permite CSSOM. Não há git — qualquer reescrita precisa de backup prévio. Ver `proposal.md` para o motivo; ver deltas para os contratos.

## Goals / Non-Goals

**Goals:**
- Substituir integralmente a identidade visual (CSS + composição SVG) sem alterar comportamento, formato de dados, validação, acessibilidade, teclado ou segurança.
- Manter a página rica em DOM estático (funciona sem JS) e o caminho de texto dinâmico exclusivamente `.textContent`.
- Re-base apenas das asserções geométricas da suíte de aceitação, preservando as asserções de comportamento.

**Non-Goals:**
- Sem mudança no `localStorage` (seed, sanitização, 600/200/256KB), sem mudança de CSP, sem dependências, sem fontes externas, sem imagens raster.
- Sem reescrita das animações de comportamento (flip, shake, enter, partículas) — apenas suas cores/temas.
- Sem tocar nos requisitos de `flashcard-deck`/`accessible-interface` (comportamento idêntico).

## Decisions

**D1 — Toda a papelaria é markup estático em `index.html`; JS só alterna estado.** Pilha rotacionada, pautas, margem vermelha, fita washi (path serrilhado + `<pattern>` listrado), clipe e os dois carimbos (`<g class="stamp">` com borda dupla tracejada + texto estático `DOMINADO`) entram escritos no HTML; `script.js` apenas faz `classList.toggle('is-hidden', learned)` nas duas faces. *Alternativa descartada*: gerar via `createElementNS` — verboso, quebraria a checagem de DOM estático sem JS e não traz dinamismo real.

**D2 — Nova malha 540×360 com constantes nomeadas.** Cartão principal `x=34, y=26, w=472, h=310` (+ sombra `<rect>` preto em `+6/+6`); pilha com `rotate(-2.5 270 180)` ciano e `rotate(2 270 180)` coral atrás; badge canto superior esquerdo; fita no topo central `rotate(-3)` sobre a borda; clipe superior direito; margem vermelha horizontal logo abaixo do cabeçalho; pautas azuis a cada ~30px; carimbo no canto inferior direito (caixa ~366–506 × 284–338, `-12°`). Área de texto: `TEXT_X=56`, `TEXT_MAX_WIDTH=418`, `TEXT_TOP=118`, `TEXT_BOTTOM=268` (encerra acima do carimbo — cumpe o cenário "não colide com badge, fita ou carimbo"; `maxLines` + reticências já existentes absorvem respostas longas). A malha mantém `viewBox` proporcional para o cartão continuar cabendo a 360px.

**D3 — Medidor segmentado mantém fórmula contínua.** `progressFill` continua retângulo de largura `(pct/100)*TRACK_WIDTH` (asserções de 0/25/100% mudam só de número, não de semântica); as "células" são divisores estáticos desenhados **por cima** do fill (track `w=308, h=26`, 10 células, borda 3px, `viewBox 0 0 340 104`), dando o visual de bateria analógica. *Alternativa descartada*: snap por célula — arredondaria 25%→20/30% e quebraria o cenário de porcentagem exata.

**D4 — Cores dinâmicas via CSSOM com paleta literal.** Partículas trocam `--hue` por `--tone` escolhido entre os 5 hexes da paleta (array literal em JS, `circle.style.setProperty` — caminho já comprovado sob CSP), `fill: var(--tone)` no CSS. Nenhum valor de cor vindo de usuário e nenhuma mudança na allowlist.

**D5 — Ícones estáticos, `aria-hidden`, rótulos intactos.** `<svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` com `stroke="currentColor"` antes do texto de todos os 8 botões (Adicionar = +, Restaurar = ↺ além dos 5 enumerados — preserva nome acessível = texto do rótulo). Nada dinâmico nos ícones → sem conflito com TT/CSP.

**D6 — Tipografia por pilha de sistema.** Títulos: `'Arial Black','Segoe UI Black',system-ui,sans-serif` (900); dados/atalhos/badges: `Consolas,'Cascadia Mono','Courier New',monospace`. Zero `@font-face`/downloads — respeita `font-src 'self'` e a regra de zero bibliotecas.

**D7 — Tokens e microinterações em CSS puro.** `--paper:#f4f0ea; --ink:#111; --card:#fffdf7; --yellow:#fde047; --mint:#4ade80; --coral:#fb7185; --cyan:#38bdf8;` + `--shadow:5px 5px 0 #111`. Fundo `radial-gradient` de pontos. Transições curtas (120ms) em `transform`/`box-shadow` nos botões; `:focus-visible` com anel contrastante por cima do estilo hover/active. Breakpoints existentes (960/430) preservados.

**D8 — Backup + re-base da suíte.** Sem git: copiar os 3 arquivos atuais para `%TEMP%\opencode\mf-backup-neo\` antes da reescrita (rollback manual). A suíte perde apenas números geométricos antigos (viewBox, larguras 72/288, font-size) e ganha cenários novos: superfície de papel, borda/sombra, hover/active, paleta, ícones (8), carimbo ligado ao learned, fita/clipe/pautas, medidor segmentado — mantendo intactos os blocos de segurança (8.x) e de comportamento.

## Risks / Trade-offs

- [Área de texto menor (até `y=268`) reduz linhas máximas] → default cabe com folga (respostas seed ≤ 7 linhas); `maxLines`+`…` já truncam com elegância; verificado na suíte.
- [Fita/clipe/carimbo podem colidir com texto longo em telas estreitas] → geometria fixa em viewBox (escala junto), colisões evitadas pelos limites de `D2` e testadas por cenário.
- [`transform`/fills em atributos de apresentação x CSP] → CSP só bloqueia o atributo `style=`; atributos de apresentação são permitidos; nenhum `style=` em markup (já asserado por `8.1g`).
- [Order de archive recusa deltas MODIFIED] → `memo-flash-svg` (36/36) deve ser arquivado antes deste change; registrado no proposal (Impact) e nos INFO do `validate --strict`.
- [Reescrita visual grande em 3 arquivos sem VCS] → backup em temp antes de editar + suíte completa como gate de regressão.
