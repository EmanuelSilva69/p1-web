# Tasks

## 1. Ambiente de verificação e segurança de edição

- [x] 1.1 Fazer backup dos 3 arquivos atuais (`index.html`, `style.css`, `script.js`) para `%TEMP%\opencode\mf-backup-neo\` e verificar que os 3 backups existem com o mesmo tamanho dos originais (rollback possível sem git).
- [x] 1.2 Recriar o harness temporário na raiz (`__verify.html` gerado do `index.html`, `__verify.js`, `__capture.js` externo, herdando a CSP) e rodar a suíte atual como linha de base; verificar `TOTAL 113/113` antes de qualquer mudança visual.

## 2. Tokens, superfície e chrome neo-brutalista (CSS)

- [x] 2.1 Reescrever os tokens do `style.css` (paleta `--paper #f4f0ea`, `--ink #111`, `--card #fffdf7`, `--yellow #fde047`, `--mint #4ade80`, `--coral #fb7185`, `--cyan #38bdf8`), o fundo de papel com `radial-gradient` e os pares tipográficos (título sans pesada, contadores/atalhos/badges monoespaçados sem `@font-face`); verificar no harness que o `background` do body resolve creme com gradiente, que o `h1` cai em sans pesada e que contador/badges caem em monoespaçada.
- [x] 2.2 Aplicar `3px solid #111` + `box-shadow: 5px 5px 0 #111` em painéis, campos e botões; verificar via harness/CSSOM que os elementos inspecionados resolvem borda de 3px preta e sombra sem blur.
- [x] 2.3 Implementar as microinterações (hover `translate(-2px,-2px)` + sombra `7px 7px 0`, `:active` `translate(3px,3px)` + sombra `2px 2px 0`, `:focus-visible` contrastante); verificar com CDP (`Input.dispatchMouseEvent` + `getComputedStyle`) que hover/active resolvem esses transform/sombra e que o foco por teclado continua visível.
- [x] 2.4 Eliminar qualquer resquício do tema roxo/escuro; verificar com grep nos 3 entregáveis que nenhum hex antigo (`#4f46e5`, `#6d28d9`, `#9333ea`, `#0f766e`, `#080b1d` etc.) permanece e que os 5 hexes novos estão presentes.

## 3. Ícones SVG inline nos botões

- [x] 3.1 Inserir em todos os 8 botões o ícone estático `<svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` com `currentColor` (plus, seta ←, giro, seta →, check, dados, lixeira, ↺); verificar no harness que há exatamente 8 ícones com essas dimensões/viewBox e que o texto acessível de cada botão ainda é o rótulo original (ícone não adiciona texto).

## 4. Composição das faces em SVG (540×360)

- [x] 4.1 Trocar as duas faces para `viewBox="0 0 540 360"` e desenhar a pilha de cartões de fundo (`rotate(-2.5 270 180)` ciano e `rotate(2 270 180)` coral, borda 3px), o `<rect>` de sombra dura preta +6/+6 e o cartão principal (frente `#fffdf7`, verso `#dcfce7`, borda 3.5px); verificar no harness o viewBox, os dois retângulos rotacionados com esses transforms e a sombra deslocada.
- [x] 4.2 Desenhar as pautas azuis com `<line>`, a margem vermelha no topo e o badge monoespado FRENTE/VERSO; verificar no harness a presença das linhas pautadas, a linha vermelha e o texto dos badges.
- [x] 4.3 Desenhar a fita washi (path serrilhado, `opacity="0.85"`, `rotate(-3)`, padrão listrado) no topo central e o clipe de papel no canto superior direito; verificar no harness o path da fita com opacity/transform e o path do clipe.
- [x] 4.4 Adicionar em ambas as faces o carimbo `<g class="stamp">` (borda dupla tracejada, `-12°`, texto `DOMINADO`) e ligá-lo ao estado aprendido via `classList.toggle('is-hidden', …)`; verificar no harness os dois cenários: marcado como aprendido → carimbo visível nas duas faces; desmarcar → carimbo oculto.
- [x] 4.5 Atualizar as constantes de geometria do texto (`TEXT_X=56`, `TEXT_MAX_WIDTH=418`, `TEXT_TOP=118`, `TEXT_BOTTOM=268`) e `renderTextBlock`; re-basear no harness os cenários de wrap (≤38 chars, `<tspan>` por linha, namespace) e o novo cenário de limites: todos os `<tspan>` dentro de 540×360 e abaixo da margem/sobre o carimbo sem colisão.

## 5. Medidor de progresso segmentado

- [x] 5.1 Redesenhar o SVG do progresso (`viewBox="0 0 340 104"`, trilho `w=308 h=26` com borda 3px, 10 divisores estáticos por cima do fill) mantendo a fórmula contínua em `renderProgress`; verificar no harness os valores re-baseados: 0%→`width 0`, 25%→`77`, 75%→`231`, 100%→`308`, com contagem e indicador de conclusão corretos.

## 6. Recoloração dos elementos dinâmicos e animações

- [x] 6.1 Trocar as partículas de `--hue` para `--tone` com cores escolhidas do array literal da paleta via CSSOM, e recolorir estado vazio e aviso de validação pela paleta; verificar no harness que a explosão ainda cria 14 círculos com `--tone` de um dos 5 hexes e que o aviso/shake continuam funcionando.
- [x] 6.2 Preservar keyframes de comportamento (`flip`, `shake`, `cardEnter` sem transbordo horizontal, partículas); verificar no harness que o shake aparece na validação vazia, que a virada reseta ao trocar de cartão e que a animação de entrada não cria scroll horizontal.

## 7. Verificação de integração

- [x] 7.1 Rodar a suíte completa re-baseada em 1440px + reload em 768px + largura em 500px + 360px real via CDP + DOM estático sem JS; verificar `TOTAL` 100% nos cinco modos.
- [x] 7.2 Re rodar a auditoria de segurança: grep de sinks proibidos = 0, `node --check script.js` OK, suíte 8.x (CSP/TT/allowlist/sanitização/limites) verde e sessão completa via CDP com **0 eventos** de console/exception/violação.
- [x] 7.3 Inspecionar o resultado no navegador nos cenários visuais manuais (pilha, fita, clipe, carimbo, medidor, hover/active, paleta, sem roxo) e validar estritamente com `openspec validate "neo-brutalist-redesign" --strict` (apenas os 2 INFO de ordem de archive).
- [x] 7.4 Remover os arquivos de harness/diagnóstico da raiz (manter apenas `index.html`, `style.css`, `script.js` + `openspec/`) e verificar o listado da raiz.

## Workflow follow-up

- Arquivar **primeiro** o change `memo-flash-svg` (36/36) para criar as specs principais — sem isso, o `openspec archive` recusa os deltas MODIFIED deste change (já reportado por `validate --strict` como INFO).
- Depois de revisado e implementado, arquivar `neo-brutalist-redesign` e conferir que `flashcard-rendering`/`study-session` foram atualizados e `visual-identity` criada em `openspec/specs/`.
