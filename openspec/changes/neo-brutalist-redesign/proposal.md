# Proposal

## Why

O visual atual é um tema dark com gradiente roxo/índigo tipicamente associado a templates gerados por IA: ele não comunica "material de estudo" nenhuma e contradiz o espírito da disciplina de um app de flashcards analógicos. Este change troca essa identidade por uma estética Neo-Brutalista de caderno de estudos — fichas pautadas, fita adesiva, clipe, carimbo e marcador de texto — mantendo integralmente o comportamento, as restrições da disciplina e o hardening de segurança já verificado (36/36 tarefas do change `memo-flash-svg`).

## What Changes

- **Nova identidade visual em CSS3**: fundo de papel creme `#f4f0ea` com textura de pontos/quadriculado via `radial-gradient`; painéis, campos e botões com `3px solid #111` e sombra dura `5px 5px 0 #111`; microinterações de botão (hover sobe com `translate(-2px,-2px)` + sombra `7px 7px 0`, `:active` afunda com `translate(3px,3px)` + sombra `2px 2px 0`); paleta marcador `#fde047`, menta `#4ade80`, coral `#fb7185`, ciano `#38bdf8`, papel `#fffdf7`; títulos em sans pesada e contadores/atalhos/badges em monoespacada.
- **Composição das fichas refeita em SVG**: novo `viewBox="0 0 540 360"` com pilha de 2 cartões de fundo rotacionados (ciano `-2.5°`, coral `+2°`), cartão principal estilo index card (frente creme `#fffdf7`, verso menta `#dcfce7`), sombra dura por `<rect>` deslocado +6/+6, linhas pautadas com margem vermelha, fita adesiva washi serrilhada no topo, clipe de papel no canto superior direito, badge monoespada FRENTE/VERSO e carimbo rotacionado `-12°` **DOMINADO** quando o cartão está aprendido.
- **Medidor de progresso vetorial redesenhado**: barra grossa com divisões estilo bateria/medidor analógico e borda preta de 3px (semântica de porcentagem inalterada).
- **Ícones SVG inline em todos os 8 botões de ação** (`<svg width="18" height="18" viewBox="0 0 24 24">`): mais, setas ←/→, giro, check, dados, lixeira e desfazer — rótulos e nomes acessíveis preservados.
- **Recoloração dos elementos dinâmicos** (partículas, estado vazio, aviso de validação) para a nova paleta — sem mudança de comportamento.
- **BREAKING (somente visual)**: a geometria `500×320` e o tratamento "gradiente + padrão geométrico + drop-shadow CSS" são substituídos; qualquer asserção de teste que aponte a composição antiga precisa ser re-baseada.
- **Mantido sem alteração**: zero frameworks; `.textContent` como único caminho de texto dinâmico (`innerHTML` proibido); validação de vazio com mensagem amigável + shake; `localStorage` com os 4 cartões padrão; navegação por teclado com wrap; layout responsivo 360px+; CSP local-only + Trusted Types + allowlist de `svgEl` + sanitização/limites de payload.

## Capabilities

### New Capabilities

- `visual-identity`: a linguagem visual neo-brutalista da página — superfície de papel, molduras e sombras duras, microinterações dos controles, paleta, tipografia pareada e ícones SVG inline nos botões.

### Modified Capabilities

- `flashcard-rendering`: a composição da face do cartão sai do `viewBox="0 0 500 320"` com gradiente/padrão para o index card `540×360` com pilha de cartões, pautas, fita washi, clipe e carimbo; o cenário de limites do texto passa a referenciar a nova viewBox e a nova área útil.
- `study-session`: o requisito da barra vetorial de progresso passa a exigir o medidor segmentado neo-brutalista (borda preta de 3px e divisões analógicas), mantendo porcentagem, conclusão e cenários de 0%/25%/100%.

## Impact

- **Arquivos**: `index.html` (estrutura SVG das faces, badges, carimbo, ícones nos botões), `style.css` (reescrita dos tokens de tema, molduras, sombras, microinterações, tipografia e breakpoints), `script.js` (constantes de geometria 540×360 e área de texto, desenho do medidor segmentado, visibilidade do carimbo, recoloração das partículas).
- **Sem mudança de contrato de dados**: formato do `localStorage`, seed, sanitização, limites (600/200/256KB) e CSP intactos.
- **Verificação**: a suíte de aceitação existente re-baseia as asserções geométricas (viewBox, `font-size`, larguras da barra) e ganha cenários novos da identidade visual; arquivos de harness continuam temporários, fora da raiz do projeto.
- **Ordem de archiving**: este change tem `flashcard-rendering` e `study-session` como capacidades modificadas, mas o change `memo-flash-svg` (36/36, completo) ainda não foi arquivado, então `openspec/specs/` está vazio. O archiving de `memo-flash-svg` precisa ocorrer **antes** deste change para que os deltas MODIFIED tenham base; este change não arquiva nada por conta própria.
