# Spec Delta

## Purpose

Defines how a single flashcard face is drawn as vector graphics: the 500×320 SVG composition, the automatic line wrapping of card text, and the rule that all data reaches the DOM through text nodes rather than markup parsing.

## ADDED Requirements

### Requirement: Render the card face as an SVG composition
The system SHALL render the current card side inside an `<svg>` element with `viewBox="0 0 500 320"` containing a linear gradient fill, a drop-shadow effect, a geometric background pattern and a badge identifying the side as FRENTE (PERGUNTA) or VERSO (RESPOSTA).

#### Scenario: Render the question side
- **WHEN** the current card is displayed on its front
- **THEN** the SVG shows the card question, a badge reading FRENTE (PERGUNTA), and the gradient, shadow and geometric pattern are visible

#### Scenario: Render the answer side
- **WHEN** the current card is displayed on its back
- **THEN** the SVG shows the card answer and a badge reading VERSO (RESPOSTA) with the same visual treatment

#### Scenario: No card in the deck
- **WHEN** the deck is empty
- **THEN** the SVG area shows an explicit empty-state message instead of a broken or blank card

### Requirement: Wrap card text into lines automatically
The system SHALL split displayed text into lines of at most 38 characters and render each line as its own `<tspan>` inside a single `<text>` element, with each `<tspan>` created via `document.createElementNS` and populated with `.textContent`.

#### Scenario: Question longer than 38 characters
- **WHEN** a card's question contains more than 38 characters
- **THEN** the text is split into consecutive lines of at most 38 characters, each rendered as a separate `<tspan>` positioned on its own baseline

#### Scenario: Text with existing line breaks
- **WHEN** the stored text contains newline characters
- **THEN** explicit newlines are honored as line boundaries and no produced line exceeds 38 characters

#### Scenario: Short text
- **WHEN** the displayed text fits within 38 characters
- **THEN** it renders as a single `<tspan>` line without clipping

### Requirement: Insert all dynamic strings as text only
The system SHALL insert every user-entered or state-derived string into the page and into SVG `<text>`/`<tspan>` elements exclusively through `.textContent`; `.innerHTML` MUST NOT be used for dynamic content.

#### Scenario: Question containing markup characters
- **WHEN** the user saves a question containing `<b>`, `&` or `<script>` characters
- **THEN** those characters appear literally as text in the rendered card, no element or attribute is created from them, and no script executes

#### Scenario: Static helper markup
- **WHEN** static structure written by the developer is created at runtime
- **THEN** it is created with `createElement`/`createElementNS` and attributes are set with `.setAttribute`, never by assigning markup strings to `innerHTML`

### Requirement: Keep card text inside the card bounds
The system SHALL lay out wrapped lines within the card's text area so long content remains readable instead of overflowing the SVG viewport.

#### Scenario: Question spanning many lines
- **WHEN** a card's text wraps to more lines than comfortably fit at the default start position
- **THEN** the first line is positioned so that all lines stay inside the 500×320 viewBox and do not collide with the badge

### Requirement: Restrict executable content with a Content Security Policy
The page SHALL declare a Content Security Policy before any resource loads that permits scripts, styles and images only from the application's own local files, forbids inline script, inline event handlers, inline style attributes, external origins, plugins, frames, workers and network connections, and requires Trusted Types for script sinks.

#### Scenario: Policy precedes every resource
- **WHEN** the document head is parsed
- **THEN** a meta CSP declared before the stylesheet and scripts restricts `script-src`/`style-src`/`img-src` to local resources and disables objects, frames, workers and connections, and the local application still initializes

#### Scenario: Injected inline script does not execute
- **WHEN** code or injected content inserts a `<script>` with inline text into the document at runtime
- **THEN** the browser refuses the assignment, no code runs, and no page error escapes the guard

#### Scenario: Injected inline event handler does not fire
- **WHEN** an attribute such as `onclick` is attached to an element carrying dynamic content
- **THEN** activating the element executes nothing

#### Scenario: Script sinks require Trusted Types
- **WHEN** code assigns markup through a script sink (a container's `innerHTML` or a script element's text)
- **THEN** the assignment is refused by the policy instead of being executed

### Requirement: Constrain dynamic node creation to an allowlist
Dynamic SVG nodes SHALL be creatable only through a helper limited to an allowlist of tags (`tspan`, `circle`, `g`) with per-tag attributes, and the helper MUST refuse event-handler, `href`/`xlink:href` and `style` attributes as well as numeric attributes that are not finite numbers.

#### Scenario: Non-allowlisted tag is refused
- **WHEN** code requests a `script`, `foreignObject` or any tag outside the allowlist
- **THEN** the helper throws and no node is created

#### Scenario: Handler or URL attribute is refused
- **WHEN** code passes `onclick`, `href`, `xlink:href` or `style` to the helper
- **THEN** the helper throws and no node is created

#### Scenario: Normal rendering is unaffected
- **WHEN** the app renders wrapped lines and the particle burst
- **THEN** `tspan`, `circle` and `g` nodes with their allowed attributes are still created and every numeric attribute value is a finite number
