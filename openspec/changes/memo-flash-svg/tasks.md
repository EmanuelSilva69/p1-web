# Tasks

## 1. Page skeleton and static assets

- [x] 1.1 Create `index.html` with the semantic shell (`header`, `main`, `section`, `aside`, `footer`) plus linked `style.css` and deferred `script.js`; verify opening the file in a browser shows the title, study section, side panel and footer with no console errors.
- [x] 1.2 Add the add-card form with `Pergunta` and `Resposta` fields, each with a `<label for>` bound to its input and `required` attributes; verify clicking either label focuses its input and the DOM contains one visible label per field.
- [x] 1.3 Add the full control bar as native `<button>` elements (Adicionar, Anterior, Virar, Próximo, Marcar Aprendido, Embaralhar, Excluir, Restaurar Padrão); verify every control is reachable by Tab and shows a visible focus style.
- [x] 1.4 Author the card SVG skeleton in HTML: `<svg viewBox="0 0 500 320">` with `<defs>` containing a `linearGradient`, a drop-shadow `<filter>` and a geometric `<pattern>`, a FRENTE/VERSO badge, and stacked front/back faces inside a `.card-scene` wrapper; verify the static page renders gradient, shadow, pattern and badge with JavaScript disabled.
- [x] 1.5 Author the progress-bar SVG (track rect, fill rect, percentage `<text>`, counter) and the empty-state message node; verify both render in place with placeholder text.
- [x] 1.6 Build `style.css` base layout with design tokens (colors, spacing, radii), the card-scene perspective, control-bar grid and visible focus ring; verify at 1440px and 360px widths there is no horizontal scrollbar.
- [x] 1.7 Add keyboard-shortcut hints as visible text in the `footer` (Espaço, ←/→); verify the hints are readable on both desktop and 360px viewports.

## 2. State, persistence and deck operations

- [x] 2.1 In `script.js`, define `DEFAULT_CARDS` (4 Desenvolvimento Web cards), `loadState()` with JSON parse + shape validation + fallback to defaults, and `persist()` wrapped in `try/catch` using key `memoflash-v1`; verify a first visit seeds exactly 4 unlearned cards and writes the key, and a corrupted stored value falls back to the defaults without throwing.
- [x] 2.2 Implement `addCard()` with `trim()` guards that append the card, clear the form, set it current and persist; verify submitting non-empty text adds one card and that submitting empty/whitespace-only text mutates nothing (deck length unchanged).
- [x] 2.3 Implement `deleteCard()` with index clamping and an empty-deck state (`currentIndex = -1`); verify deleting from a 2-card deck lands on a valid card, and deleting the last card shows the empty state with a 0 of 0 counter and no errors.
- [x] 2.4 Implement `shuffleDeck()` (Fisher-Yates, reset to first card, front side) preserving each card's learned flag; verify shuffling a deck with mixed statuses reorders cards while learned statuses follow their cards, and shuffling 0–1 cards changes nothing.
- [x] 2.5 Implement `restoreDefaults()` replacing the deck with the 4 defaults, all unlearned, current index 0, then persisting; verify the deck becomes exactly the defaults after prior add/delete/mark operations.
- [x] 2.6 Verify persistence end-to-end manually: mark a card and navigate, reload the page, and confirm cards, learned flags, order and counters are restored.

## 3. Safe text pipeline and SVG card rendering

- [x] 3.1 Implement `svgEl(tag, attrs)` (`createElementNS` + `setAttribute`), `setText(el, str)` (`.textContent` only) and `wrapText(str, max = 38)` honoring `\n`, greedy word wrap and hard-splitting words longer than 38 chars; verify with sample strings that no returned line exceeds 38 characters and explicit newlines are kept.
- [x] 3.2 Implement `renderCard()` populating the hook nodes: clear via `textContent = ""`, build one `<tspan>` per wrapped line with `document.createElementNS` + `.textContent`, and set the FRENTE (PERGUNTA) / VERSO (RESPOSTA) badge per side; verify switching sides updates both text and badge and each rendered line is a separate `<tspan>` on its own baseline.
- [x] 3.3 Implement vertical centering of the line block, font-size step-down and ellipsis for content exceeding the text area; verify a very long question stays inside the 500×320 viewBox and never overlaps the badge.
- [x] 3.4 Verify the security rule: save a question containing `<b>hi</b> & <script>alert(1)</script>`, confirm it displays literally as text with no element created and no script execution, then run a search over `script.js` confirming zero occurrences of `innerHTML`.

## 4. Study interactions and vector feedback

- [x] 4.1 Implement flip toggling the `.is-flipped` class on click and on Space with an `isAnimating` guard, writing both faces' content at flip start; verify the card ends on the opposite side, the current index and deck data stay unchanged, and Space does not scroll the page.
- [x] 4.2 Implement `prevCard()`/`nextCard()` with wrap-around plus the previous/next buttons; verify Next on the last card shows the first, Previous on the first shows the last, and navigation resets each card to its front side.
- [x] 4.3 Add the between-cards transition animation re-triggered via forced reflow; verify rapid clicking of Next plays the transition each time instead of only once.
- [x] 4.4 Implement `toggleLearned()` updating the status, persisting, and reflecting the state on the button; verify marking flips to learned, unmarking flips back, both persist across reload, and toggling in an empty deck throws nothing.
- [x] 4.5 Implement the SVG particle burst on the unlearned → learned transition: create ~14 `<circle>` nodes with CSS custom properties, remove the group on `animationend` with a `setTimeout` fallback; verify a burst plays on marking and no particle nodes remain in the DOM afterwards.
- [x] 4.6 Implement `renderProgress()` computing `total ? round(learned/total × 100) : 0`; verify 1 of 4 shows 25% with the fill at 25% of the track, an empty deck shows 0% and "0 de 0" (never `NaN`), and all-learned shows 100% with a completion indicator.

## 5. Form validation feedback

- [x] 5.1 On blocked submission, set the warning message via `.textContent` on an `aria-live="polite"` element, add the `.shake` class restarted by forced reflow, and focus the first empty field; verify submitting an empty question (answer filled) shows the friendly warning with shake, announces it, adds no card, and the app keeps working.
- [x] 5.2 Clear the warning and shake class when the user edits either field and on a successful submit; verify recovery: type into the flagged field, resubmit, and the warning disappears while the card is added.

## 6. Keyboard, accessibility and responsive verification

- [x] 6.1 Register one delegated `document.keydown` listener mapping Space → flip and ArrowLeft/ArrowRight → navigate, with early-return for `input`/`textarea`/`select`/`[contenteditable]` targets and `preventDefault()` only for handled keys; verify typing spaces and arrows inside the form behaves normally while the shortcuts work elsewhere.
- [x] 6.2 Verify the complete tab order reaches every control in a logical sequence, each with a visible focus indicator, and each control activates with Enter as well as click.
- [x] 6.3 Verify the responsive layout at 360px, 768px and 1440px: stacked controls and readable card on mobile, study section and `aside` side by side on desktop, no overlapping elements and no horizontal scrolling.
- [x] 6.4 Verify landmark structure with an accessibility inspection: exactly one `main`, plus `header`, `section`, `aside`, `footer`, each with a programmatic heading or label.

## 7. Integration checks

- [x] 7.1 Walk the scenarios in `specs/flashcard-deck/spec.md`, `specs/flashcard-rendering/spec.md`, `specs/study-session/spec.md` and `specs/accessible-interface/spec.md` as a manual acceptance pass in the browser; verify every scenario behaves as written and record any deviation.
- [x] 7.2 Run a full session (seed → add → flip → navigate → mark → shuffle → delete → restore → reload) with devtools open; verify the console stays free of errors/warnings and the storage key holds the expected final deck.

## 8. Security hardening (code injection)

- [x] 8.1 Add a meta Content Security Policy in `index.html` before the stylesheet/scripts (local-only sources, no inline script/handlers/styles, no objects/frames/workers/connections, Trusted Types for script sinks); verify the local app still initializes on `file://` while a dynamically inserted inline script, an `onclick` attribute and a markup `style` attribute are all refused by the browser.
- [x] 8.2 Add the remaining document-level guards in `index.html` (`referrer` policy, `maxlength="600"` and `autocomplete="off"` on both fields); verify the attributes are present and pasting/typing past the limit is capped by the field.
- [x] 8.3 Restrict `svgEl()` to a tag/attribute allowlist (`tspan`/`circle`/`g`, per-tag attributes) rejecting `on*`, `href`/`xlink:href`, `style` and non-finite numbers; verify it throws for `svgEl('script', …)` and `svgEl('g', { onclick … })` while normal card and particle rendering still works.
- [x] 8.4 Implement `sanitizeText()` (normalize newlines, strip control/zero-width/bidi characters, cap at 600 chars), apply it on add and on load, cap decks at 200 cards with the friendly warning, and refuse raw payloads over 256 KB before parsing; verify control characters are removed, markup stays literal, an oversized payload falls back to defaults and a 500-card payload clamps to 200.
- [x] 8.5 Re-run the full acceptance suite plus a sink audit; verify every prior scenario still passes, zero forbidden sinks (`innerHTML`, `eval`, `new Function`, `document.write`, `insertAdjacentHTML`, `outerHTML`, `javascript:`) exist in the shipped files, and a CDP console capture reports no errors or CSP violations during a full session.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
