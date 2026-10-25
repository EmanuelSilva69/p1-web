# Proposal

## Why

The disciplina de Desenvolvimento de Sistemas Web needs a single, self-contained study artifact that demonstrates semantic HTML, modern CSS animation/responsiveness, Vanilla JS (ES6+) and direct SVG DOM manipulation — without frameworks or a build step. MemoFlash SVG is that artifact: an interactive flashcard app whose card faces, progress bar and particle effects are rendered as vector graphics, so students can study and inspect the underlying techniques at the same time.

## What Changes

- Introduce a brand-new front-end application (`index.html`, `style.css`, `script.js`) at the project root — there is no existing code to modify.
- Render each flashcard as an interactive `<svg viewBox="0 0 500 320">` (linearGradient, drop-shadow, geometric background pattern, FRENTE/VERSO badge) with automatic line wrapping into `<tspan>` nodes built with `document.createElementNS` + `.textContent`.
- Add a study experience: flip animation (click / Space), previous/next navigation (arrow keys), mark-as-learned with SVG particle burst, vector progress bar, and a shuffle control.
- Add deck management: add, delete, restore defaults, and persistence of cards plus learned status in `localStorage` (seeded with 4 initial Desenvolvimento Web cards on first access).
- Enforce safe rendering: every user-entered or state-derived string reaches the DOM and SVG `<text>`/`<tspan>` exclusively through `.textContent`; `.innerHTML` is forbidden.
- Validate the add form: empty question or answer shows an accessible warning with a shake animation while leaving the deck untouched.
- Deliver semantic, accessible markup (`header`, `main`, `section`, `aside`, `footer`, `<label>` bound to every field) and a responsive layout.

## Capabilities

### New Capabilities

- `flashcard-deck`: Deck data lifecycle — seeding the 4 default cards, adding and deleting cards, shuffling, restoring defaults, and persisting cards plus learned flags in `localStorage` across sessions.
- `flashcard-rendering`: Vector card rendering — the 500×320 SVG card (gradients, shadow, geometric pattern, FRENTE/VERSO badge), automatic ≤38-character line wrapping into `<tspan>` built with `createElementNS` + `.textContent`, and safe DOM insertion of untrusted strings.
- `study-session`: Study interaction — flip animation, previous/next navigation, keyboard shortcuts, mark-as-learned with SVG particles, and the vector progress bar showing the learned percentage.
- `accessible-interface`: Semantic and accessible shell — landmark elements, `<label>` bound to each input, friendly empty-input validation with shake feedback, focus/keyboard operability, and responsive layout.

### Modified Capabilities

- None — this is the first capability set in the project.

## Impact

- **Files created**: `index.html`, `style.css`, `script.js` (project root, no build tooling, no dependencies).
- **Browser storage**: one `localStorage` key holding cards + learned status; first run seeds 4 defaults.
- **Dependencies**: none — zero frameworks/libraries; vanilla HTML/CSS/JS only.
- **Existing systems**: none affected (greenfield repository; only `.opencode/` and `openspec/` exist today).
