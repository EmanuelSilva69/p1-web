# Design

## Context

Greenfield repository: only `.opencode/` and `openspec/` exist today, so there is no code, test harness or build pipeline to conform to. The requirement is a fully static, self-contained app (`index.html`, `style.css`, `script.js`) that runs by opening the page — no bundler, no dependencies, no network calls. The behavioral contract lives in the four deltas under `specs/`; this document fixes the technical approach. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- One predictable render pipeline: state in → SVG/DOM out, so every control is a state mutation followed by a re-render.
- Guarantee the `.textContent`-only security rule structurally (helpers that make `innerHTML` unnecessary) rather than by discipline alone.
- Keep animations (flip, transition, shake, particles) declarative in CSS, with JS only toggling classes and creating/removing nodes.
- Degrade gracefully when `localStorage` is missing, full, or contains garbage.

**Non-Goals:**

- Backend, sync, multi-user or import/export of decks.
- Framework/component abstraction, TypeScript, bundling, or a test framework.
- Editing an existing card in place (cards are added, deleted, shuffled, restored — not edited).
- Localizing strings into multiple languages.

## Decisions

### D1 — Static three-file layout, deferred script

`index.html` carries all markup including the static SVG `<defs>`; `style.css` and `script.js` are linked with `rel="stylesheet"` and `defer`. Script is deferred so DOM queries in `DOMContentLoaded`-free top-level code always succeed.

*Alternative considered:* splitting JS into modules (`type="module"`) — rejected because `file://` module loading is blocked by CORS in several browsers, and the deliverable must run by double-clicking `index.html`.

### D2 — Single state object, explicit re-render

```js
state = { cards: [{ id, question, answer, learned }], currentIndex, side, ... }
```

Every control handler mutates `state`, calls `persist()`, then `render()`. `render()` fans out to `renderCard()`, `renderProgress()`, `renderControls()` and `renderCounter()`. Re-render is cheap (tens of nodes), so no diffing/VDOM is needed.

Edge cases are states, not exceptions: `currentIndex === -1` means "empty deck" and drives the empty-state branch of `renderCard()`.

### D3 — SVG skeleton in HTML, dynamic groups filled by JS

The card `<svg viewBox="0 0 500 320">` ships in `index.html` with `<defs>` (linearGradient, drop-shadow `<filter>`, geometric `<pattern>`), the badge, and empty `<g>`/`<text>` hook nodes. JS only populates the hook nodes.

*Alternative considered:* building the entire SVG from JS — rejected: gradients/patterns are static styling, keeping them in HTML makes the file readable and keeps JS focused on data. It also means no JS still shows a coherent (if inert) page.

Two small SVGs (front/back) are stacked inside a `.card-scene` wrapper for the flip (see D4); both share `<defs>` via unique ids prefixed `card-`.

### D4 — Flip via CSS 3D transform on a wrapper

`.card-scene { perspective: 1200px }`, two absolutely-positioned child SVGs with `backface-visibility: hidden`, the back pre-rotated 180°. Toggling `.is-flipped` on the wrapper runs `transition: transform .6s`. Content for *both* sides is written at the start of the flip, so no race with `transitionend`.

*Alternative considered:* animating the SVG `transform` attribute / SMIL — rejected: poorer browser consistency, and `backface-visibility` is what actually sells the "card" illusion.

Between-cards navigation uses a separate CSS class (slide/fade) re-triggered via `element.offsetWidth` reflow read.

### D5 — Safe text pipeline: helpers, no `innerHTML` anywhere

Three helpers form the only path from data to DOM:

- `svgEl(tag, attrs)` → `document.createElementNS(SVG_NS, tag)` + `setAttribute`.
- `setText(el, str)` → `el.textContent = String(str)`.
- `wrapText(str, max = 38)` → `string[]` (honors `\n`, greedy word wrap, hard-splits words longer than `max`).

`renderCard()` clears hook nodes with `textContent = ""`, wraps the string, and appends one `<tspan>` per line (`x` fixed, `dy` = line-height, first line gets the centered start baseline). Since no code path assigns markup strings, markup inside a question renders literally. Baseline start y is computed as `center − (lines−1)·lineHeight/2` so short and long content both stay in the text area; if lines exceed the area capacity, font-size steps down (min ~14px) and only then ellipsize.

### D6 — Progress bar as data-bound SVG geometry

A `<rect>` track plus a `<rect>` fill whose `width` is `pct/100 × trackWidth`, a `<text>` percentage label and an "X de Y" counter. Percentage is `total ? round(learned/total × 100) : 0`, which structurally rules out `NaN`/negatives for the empty deck.

### D7 — Particles as transient SVG nodes

On mark-as-created: create ~14 `<circle>` nodes inside a dedicated `<g>`, give each a CSS custom property (`--tx`, `--ty`, `--delay`, color) and a class that runs a keyframe scaling/moving them outward. Cleanup on `animationend` (with a `setTimeout` fallback) removes the `<g>` — prevents node accumulation and leaks. Runs only on the *unlearned → learned* transition.

### D8 — Persistence with a versioned key and fallback chain

Key `memoflash-v1`, JSON payload `{ cards, currentIndex, side }`. `loadState()` order: parse → validate shape (array, non-empty strings) → fall back to `DEFAULT_CARDS`. Writes are wrapped in `try/catch`; on failure the app keeps working in memory (private-browsing quota, disabled storage). Seed happens only when the key is absent or the payload is invalid — never on every load.

### D9 — One delegated keyboard listener

A single `document.keydown` handler maps `Space` → flip, `ArrowLeft`/`ArrowRight` → navigate, and calls `preventDefault()` for those keys. It early-returns when `event.target` is `input`/`textarea`/`select`/`[contenteditable]`, which satisfies both the shortcuts and the "shortcut suppressed in inputs" requirement. Rapid activations are ignored while an animation flag is set (`isAnimating`), preventing double-flips and skipped cards.

### D10 — Validation = guarded mutation + live region + shake class

`addCard()` returns early after `trim()` checks, so no state mutation happens on empty input. It then sets the message on an `aria-live="polite"` element via `textContent`, focuses the first empty field, and toggles a `.shake` animation restarted by a forced reflow. The class is removed on `input` from either field.

*Alternative considered:* HTML5 `required` + `:invalid` pseudo-classes only — rejected as the sole mechanism: native bubbles aren't the friendly in-app warning the requirements ask for, so validation is done in JS with the native attributes kept as progressive enhancement.

### D11 — UI copy in pt-BR

All labels, badges and messages are Portuguese (`FRENTE (PERGUNTA)`, `VERSO (RESPOSTA)`, `Adicionar`, `Embaralhar`, `Restaurar Padrão`, …), matching the assignment context. Strings live in a single `UI` object so they can be swapped without touching logic.

### D12 — Defense in depth against code injection

Measured on the real `file://` page with headless Chrome before committing to it:

- **Meta CSP** `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; media-src 'none'; manifest-src 'none'; worker-src 'none'; require-trusted-types-for 'script'` placed before the stylesheet. Verified: local script/stylesheet still load under `file://` (`script-src 'self'` does **not** break double-click usage), dynamically inserted inline `<script>`, `onclick` attributes and markup `style=""` attributes are all refused, while CSSOM `style.setProperty` (particle `--tx`/`--ty`/`--delay`/`--hue`) keeps working — so the strict policy costs the app nothing.
- **Trusted Types** (`require-trusted-types-for 'script'`) is enforced even via `<meta>` in Chrome: assigning a script element's `textContent` throws `TrustedScript assignment required`, **and so does `setAttribute('onclick', …)`** — inline event handler content attributes are TrustedScript sinks too, so an injected handler dies at assignment time (with CSP as the second layer for anything that slips through markup parsing). Browsers without support ignore the directive, leaving the rest of the policy active.
- **Allowlisted `svgEl`**: tags limited to `tspan`/`circle`/`g` with per-tag attributes; `on*`, `href`/`xlink:href`, `style` and non-finite numbers rejected by throwing. This is the structural guarantee that the "createElementNS + textContent" pipeline can never be steered into an SVG `<script>` or handler attribute, even if a future caller passes user data as a tag.
- **Sanitization is deliberately not HTML sanitization**: markup characters (`<`, `>`, `&`) stay literal — the security property comes from `textContent` + CSP, not from mangling user text (which would violate the rendering spec's "renders literally" scenarios). What is removed is only what has no legitimate use: control characters (except newline), zero-width and bidi-override characters (spoofing), plus hard caps — 600 chars per field, 200 cards per deck, 256 KB raw payload refused before `JSON.parse`.

*Alternatives considered:* shipping an HTML-sanitizer for card text — rejected: there is no HTML parse sink to sanitize, and stripping markup would break the "literal text" requirement; using `'unsafe-inline'` for styles because `style-src 'self'` blocks markup `style` attributes — rejected: the page has no inline styles and CSSOM is unaffected, so strictness is free.

## Risks / Trade-offs

- **`innerHTML` sneaks in during implementation** → helpers in D3 are the only write path; a task explicitly greps `script.js` for `innerHTML` before finishing.
- **`localStorage` unavailable or corrupt** → `try/catch` around read/write with in-memory fallback and re-seed on invalid shape (D8); app remains usable.
- **Very long card text overflows the 500×320 box** → wrap (≤38 chars) + dynamic first-baseline centering + font-size step-down + ellipsis (D5).
- **Animation races** (flip + re-render + navigation queued) → `isAnimating` guard and content written for both faces up front (D4, D9).
- **Particle nodes accumulate on repeated marking** → deterministic cleanup on `animationend` with timeout fallback (D7).
- **Keyboard shortcuts steal scrolling/typing** → early-return for editable targets and `preventDefault` only for the handled keys (D9).
- **`file://` quirks** (no modules, no fetch) → plain deferred script, zero external assets (D1).
- **No automated tests** → scenarios in the four specs serve as the manual acceptance checklist, mapped 1:1 onto tasks.

## Migration Plan

Not applicable — nothing exists yet. Rollback is deleting `index.html`, `style.css`, `script.js` and the `memoflash-v1` storage key; no other system references this app.

## Open Questions

- None blocking. One minor behavior was decided here rather than in the specs: after "Embaralhar" the deck resets to the first card on its front side (consistent with D2). Changing it later would not alter any spec requirement.
