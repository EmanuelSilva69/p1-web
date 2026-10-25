# Spec Delta

## Purpose

Defines the page shell around the deck: semantic landmark structure, form labelling and focus behavior, friendly feedback for invalid input, and a layout that adapts from wide screens down to small mobile viewports.

## ADDED Requirements

### Requirement: Use semantic landmark structure
The system SHALL organize the page with `header`, `main`, `section`, `aside` and `footer` elements so assistive technology can identify the title, the study area, the side panel and the page footer.

#### Scenario: Landmark outline
- **WHEN** the page is inspected by an accessibility tool
- **THEN** a `header`, at least one `main`, one `section`, one `aside` and a `footer` are present, each with a programmatic heading or label identifying its purpose

#### Scenario: Single main region
- **WHEN** the page structure is read as a document outline
- **THEN** exactly one `main` region contains the study controls and the flashcard

### Requirement: Bind a label to every form field
The system SHALL associate a `<label>` element with each form input through matching `for`/`id`, so clicking a label focuses its field and each field announces its purpose.

#### Scenario: Focus follows label click
- **WHEN** the user clicks the "Pergunta" label
- **THEN** focus moves to the question input and its accessible name is read as "Pergunta"

#### Scenario: Every field labelled
- **WHEN** the add form is inspected
- **THEN** each input has exactly one associated visible label

### Requirement: Validate empty input with friendly feedback
The system SHALL block submission when the question or answer is empty or whitespace-only, show a friendly warning and shake the form, and leave the application fully functional.

#### Scenario: Empty question submitted
- **WHEN** the user activates the add control with an empty question while the answer has text
- **THEN** a visible warning explaining that both fields are required appears with a shake animation, focus moves to the offending empty field, and no card is added

#### Scenario: Recovery after a failed submission
- **WHEN** the user types in the flagged field and submits again successfully
- **THEN** the warning disappears, the shake stops, and the card is added

#### Scenario: Warning is announced
- **WHEN** the warning appears
- **THEN** it is rendered as live-region text so screen readers announce it without a page change

### Requirement: Keep all controls operable by keyboard and pointer
The system SHALL make every control (add, previous, flip, next, mark learned, shuffle, delete, restore defaults) a focusable native element that activates with Enter/Space and shows a visible focus indicator.

#### Scenario: Tab order reaches all controls
- **WHEN** the user presses Tab across the page
- **THEN** focus visits every control in a logical order and each shows a visible focus style

#### Scenario: Activate a control with the keyboard
- **WHEN** a focused control is activated with Enter
- **THEN** the same action runs as when it is clicked

### Requirement: Adapt the layout responsively
The system SHALL present a usable layout from wide desktop widths down to narrow mobile widths without horizontal scrolling or overlapping controls.

#### Scenario: Narrow viewport
- **WHEN** the page is displayed at 360 CSS pixels wide
- **THEN** the card, the form, the controls and the progress area stack vertically, remain readable, and no horizontal scrollbar appears

#### Scenario: Wide viewport
- **WHEN** the page is displayed on a desktop screen
- **THEN** the study section and the aside are laid out side by side with the card scaling to its container
