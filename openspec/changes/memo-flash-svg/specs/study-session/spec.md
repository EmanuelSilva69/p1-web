# Spec Delta

## Purpose

Covers the study experience around the deck: moving between cards, flipping a card, marking it as learned, and the vector feedback (progress bar and particles) that shows how much of the deck has been mastered.

## ADDED Requirements

### Requirement: Flip the current card
The system SHALL flip between the question and answer sides of the current card with a flip animation when the user clicks the card or presses Space, without changing the current card index.

#### Scenario: Click the card to reveal the answer
- **WHEN** the user clicks the card while it shows the front
- **THEN** a flip animation plays and the card ends showing the answer side

#### Scenario: Press Space to flip
- **WHEN** the user presses Space while focus is not inside a text field
- **THEN** the card flips and the page does not scroll as a side effect

#### Scenario: Flip does not advance the deck
- **WHEN** the user flips the card repeatedly
- **THEN** the current card index, deck order and learned statuses remain unchanged

### Requirement: Navigate between cards
The system SHALL move to the previous or next card with a transition animation when the user activates the previous/next controls or presses the Left/Right arrow keys, wrapping around at the deck ends.

#### Scenario: Next card
- **WHEN** the user activates the next control while on a non-last card
- **THEN** the following card is displayed with a transition animation and the side resets to the front

#### Scenario: Wrap around the deck
- **WHEN** the user requests the next card while on the last card
- **THEN** the first card is displayed, and requesting the previous card on the first card shows the last card

#### Scenario: Navigate with arrow keys
- **WHEN** the user presses the Right or Left arrow key while focus is not inside a text field
- **THEN** the deck moves to the next or previous card respectively

### Requirement: Mark the current card as learned
The system SHALL toggle the learned status of the current card, show an SVG particle burst when a card becomes learned, and persist the change.

#### Scenario: Mark an unlearned card
- **WHEN** the user marks the current card as learned
- **THEN** its status flips to learned, a particle effect plays over the card, the control reflects the new state, the progress bar updates, and the change is persisted

#### Scenario: Unmark a learned card
- **WHEN** the user activates the control again on a card already marked as learned
- **THEN** its status returns to unlearned, the progress bar decreases, and the change is persisted

#### Scenario: Toggle while deck is empty
- **WHEN** the deck is empty and the user activates the mark control
- **THEN** nothing changes and no error is thrown

### Requirement: Show learned progress as a vector bar
The system SHALL render a progress bar in SVG whose fill represents the percentage of cards in the deck currently marked as learned, together with that percentage as text.

#### Scenario: Partially learned deck
- **WHEN** 1 of 4 cards is learned
- **THEN** the bar is filled to 25% and the displayed percentage reads 25%

#### Scenario: Empty deck
- **WHEN** the deck contains no cards
- **THEN** the bar shows 0% and the label shows 0 of 0 without producing `NaN` or a negative value

#### Scenario: All cards learned
- **WHEN** every card in the deck is marked as learned
- **THEN** the bar shows 100% and a completion indicator is visible

### Requirement: Provide complete keyboard control
The system SHALL expose all study actions (flip, previous, next, mark) to the keyboard, with shortcuts ignored while the user is typing in a field.

#### Scenario: Shortcut suppressed in inputs
- **WHEN** the question or answer input has focus and the user types Space or arrow keys
- **THEN** the typed text behaves normally and the card does not flip or navigate
