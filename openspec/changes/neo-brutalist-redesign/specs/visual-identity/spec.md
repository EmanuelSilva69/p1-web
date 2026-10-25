# Spec Delta

## Purpose

Defines the neo-brutalist paper-and-ink visual language of the page: the study-desk surface, the heavy black frames and hard shadows, control microinteractions, the highlighter palette, the type pairing and the inline icons that give the app its analog study-notebook identity.

## ADDED Requirements

### Requirement: Present a paper-style page surface
The page background SHALL be a light cream paper tone `#f4f0ea` with a subtle dotted or grid texture produced exclusively with CSS gradients, with no image files or external resources.

#### Scenario: Rendered page background
- **WHEN** the page loads
- **THEN** the body shows the cream tone with a repeating dot or grid pattern from a `radial-gradient`/`linear-gradient`, and no dark-mode surface remains

### Requirement: Frame every surface with heavy borders and hard shadows
The sidebar and its inner panels, form fields and buttons SHALL carry a `3px solid #111111` border and a hard offset shadow `5px 5px 0px #111111` with no blur, while the study area SHALL stay unframed so the card and its controls sit directly on the desk.

#### Scenario: Inspected surfaces
- **WHEN** the sidebar, form fields and buttons are inspected
- **THEN** each computed style shows the 3px black border and a zero-blur 5px black offset shadow

#### Scenario: Study area sits on the desk
- **WHEN** the study area container and its header are inspected
- **THEN** the container has no background, border or shadow, and the header is a flex row with the title on the left and the counter on the right as a badge with a white background, a `2px` black border and a hard `2px` shadow

### Requirement: Mark authorship with a stamped header tag
The header SHALL show a static authorship tag styled as a technical stamp (monospace, white background, `2px solid #111111` border, hard `2px` offset shadow, slight rotation) and the footer SHALL carry the human authorship credit.

#### Scenario: Authorship visible
- **WHEN** the header and footer are inspected
- **THEN** the header tag reads "UFMA · Eng. da Computação" and the footer credit reads "Desenvolvido por Emanuel Lopes Silva · UFMA (EECP0036)", both rendered from static text nodes

### Requirement: Feedback the field being written in
A form field SHALL tint its surface paper-yellow `#fefce8` while focused and shift its hard shadow from `5px` to `6px`, in addition to the focus indicator.

#### Scenario: Textarea in focus
- **WHEN** a question or answer textarea receives focus
- **THEN** its computed background is `#fefce8` and its shadow is the 6px hard offset shadow, returning to white when focus leaves

### Requirement: Move controls on hover and press
Controls SHALL lift on hover (`translate(-2px, -2px)` with a `7px 7px 0px #111111` shadow) and sink into their shadow while pressed (`translate(3px, 3px)` with a `2px 2px 0px #111111` shadow), while a visible focus indicator remains for keyboard users.

#### Scenario: Hover a button
- **WHEN** the pointer hovers an enabled button
- **THEN** it shifts up-left with the enlarged hard shadow, and on `:active` it shifts down-right until only a small shadow remains

#### Scenario: Keyboard focus stays visible
- **WHEN** a control receives focus via Tab
- **THEN** a clearly visible focus indicator is shown on top of the border and shadow treatment

### Requirement: Apply the highlighter palette
The interface SHALL use highlighter yellow `#fde047`, mint `#4ade80`, coral `#fb7185`, cyan `#38bdf8` and paper white `#fffdf7` across cards, controls, badges, progress and dynamic effects, and MUST NOT retain the former purple/indigo dark gradient anywhere.

#### Scenario: Palette in static surfaces
- **WHEN** the page is rendered
- **THEN** the declared colors appear across the UI (including the yellow-highlighter field treatment and colored controls) and no `#4f46e5`/`#9333ea`-style purple gradient remains

#### Scenario: Dynamic effects follow the palette
- **WHEN** particles burst on mark-learned or the empty state and validation warning are shown
- **THEN** they are colored from the same palette

### Requirement: Pair heavy sans headings with monospace data
Headings SHALL use a heavy system sans-serif stack while counters, shortcuts, badges and numeric readouts SHALL use a monospace system stack, with no font downloads at runtime.

#### Scenario: Type pairing
- **WHEN** the heading and the counter/badge/shortcut elements are inspected
- **THEN** the heading resolves to a heavy sans-serif, the counter and badges resolve to a monospace font, and no request for a web font is made

### Requirement: Embed an inline SVG icon in every action button
Each of the eight action controls (add, previous, flip, next, mark learned, shuffle, delete, restore) SHALL contain a static inline `<svg width="18" height="18" viewBox="0 0 24 24">` icon matching its action, without altering the control's accessible name or label text.

#### Scenario: Icons present and meaningful
- **WHEN** the eight controls are inspected
- **THEN** each holds an inline 18×18 icon (plus, arrows, flip, check, dice, trash, undo) rendered from static markup

#### Scenario: Accessible names unchanged
- **WHEN** a control with an icon is read by assistive technology
- **THEN** its accessible name still matches the visible label (for example "Marcar Aprendido") and no icon introduces stray text nodes
