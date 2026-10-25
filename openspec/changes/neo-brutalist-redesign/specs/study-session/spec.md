# Spec Delta

## MODIFIED Requirements

### Requirement: Show learned progress as a vector bar
The system SHALL render a progress meter in SVG as a thick neo-brutalist gauge with a 3px black border and visible cell divisions, whose filled portion represents the percentage of cards in the deck currently marked as learned, together with that percentage as text.

#### Scenario: Partially learned deck
- **WHEN** 1 of 4 cards is learned
- **THEN** the gauge is filled to 25% of its cells and the displayed percentage reads 25%

#### Scenario: Empty deck
- **WHEN** the deck contains no cards
- **THEN** the gauge shows 0% and the label shows 0 of 0 without producing `NaN` or a negative value

#### Scenario: All cards learned
- **WHEN** every card in the deck is marked as learned
- **THEN** the gauge shows 100%, all cells are filled, and a completion indicator is visible
