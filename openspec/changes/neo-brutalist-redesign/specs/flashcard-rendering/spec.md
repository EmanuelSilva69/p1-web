# Spec Delta

## MODIFIED Requirements

### Requirement: Render the card face as an SVG composition
The system SHALL render the current card side inside an `<svg>` element with `viewBox="0 0 540 360"` composed as a physical index card on a desk: two rotated background cards stacked behind it, a ruled card face (cream on the front, mint on the back) with a heavy black border and hard offset shadow, a horizontal red margin line, a softer vertical margin line near the left edge with three punched index-card holes, washi tape at the top edge, a paper clip at the upper right, and a badge identifying the side as FRENTE (PERGUNTA) or VERSO (RESPOSTA).

#### Scenario: Render the question side
- **WHEN** the current card is displayed on its front
- **THEN** the SVG shows the card question, a badge reading FRENTE (PERGUNTA), a cream face with ruled lines, a red margin line across the top, a soft coral vertical margin at `x=82` and three punched holes at `cx=62`, the two rotated background cards (cyan at -2.5°, coral at +2°), the washi tape and the paper clip

#### Scenario: Render the answer side
- **WHEN** the current card is displayed on its back
- **THEN** the SVG shows the card answer and a badge reading VERSO (RESPOSTA) with the same stationery treatment on a mint face

#### Scenario: No card in the deck
- **WHEN** the deck is empty
- **THEN** the SVG area shows an explicit empty-state message instead of a broken or blank card

#### Scenario: Learned card carries the stamp
- **WHEN** the displayed card is marked as learned
- **THEN** a rotated -12° double-dashed ink stamp reading DOMINADO appears at the lower right of the face, fully inside the card surface, and it disappears when the card is unmarked

#### Scenario: Stamp stays clear of the text ink
- **WHEN** the stamp and the wrapped text are both present
- **THEN** the stamp sits at least 10px above its previous baseline (rotation center `430,293`, lowest corner no lower than the card's bottom edge) and its group precedes the text element in the DOM, so the text ink always paints over the stamp

### Requirement: Keep card text inside the card bounds
The system SHALL lay out wrapped lines within the card's text area so long content remains readable instead of overflowing the SVG viewport.

#### Scenario: Question spanning many lines
- **WHEN** a card's text wraps to more lines than comfortably fit at the default start position
- **THEN** the first line is positioned so that all lines stay inside the 540×360 viewBox and do not collide with the badge, the washi tape or the learned stamp

#### Scenario: Text column clears the left margin
- **WHEN** wrapped lines are laid out
- **THEN** every line starts at `x=96`, past the vertical margin rule and the punched holes, and fits inside a 388px column that ends before the right edge of the face
