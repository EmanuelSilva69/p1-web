# Spec Delta

## Purpose

Governs the flashcard collection itself: which cards exist, how users add, remove, shuffle and reset them, and how cards plus their learned status survive page reloads through browser-local persistence.

## ADDED Requirements

### Requirement: Seed default deck on first access
The system SHALL load a deck of exactly 4 initial flashcards about Desenvolvimento Web whenever no deck has been stored yet, so the application is immediately usable on first access.

#### Scenario: First visit with empty storage
- **WHEN** the application starts and no stored deck exists in `localStorage`
- **THEN** the deck contains 4 flashcards about Desenvolvimento Web, each with a non-empty question, a non-empty answer and an unlearned status

#### Scenario: Stored deck exists
- **WHEN** the application starts and a valid deck exists in `localStorage`
- **THEN** the deck loaded is the stored one and the defaults are not re-seeded

### Requirement: Add a flashcard
The system SHALL add a new flashcard built from the question and answer fields, place it in the deck, clear the fields, make it the current card, and persist the result.

#### Scenario: Add with both fields filled
- **WHEN** the user submits non-empty question and answer text and activates the add control
- **THEN** a new card with that question and answer is appended to the deck, becomes the current card, the form fields are cleared, and the deck is written to `localStorage`

#### Scenario: Add with an empty field
- **WHEN** the user activates the add control while the question or the answer (or both) is empty or whitespace-only
- **THEN** no card is added, the deck and current index are unchanged, an accessible warning is shown, and the form fields shake

### Requirement: Delete the current flashcard
The system SHALL remove the currently displayed card from the deck, keep the deck persisted, and leave the application on a valid card or in an explicit empty state.

#### Scenario: Delete from a deck of several cards
- **WHEN** the user deletes the current card while the deck holds more than one card
- **THEN** the card is removed, the deck is persisted, and a card at the same position (or the new last card when the last one was removed) becomes current

#### Scenario: Delete the only remaining card
- **WHEN** the user deletes the last card in the deck
- **THEN** the deck becomes empty, the application enters an explicit empty state without errors, and the learned count is 0 of 0

### Requirement: Shuffle the deck
The system SHALL randomize the order of all cards while preserving each card's learned status and keep the shuffled order persisted.

#### Scenario: Shuffle a deck with mixed statuses
- **WHEN** the user activates the shuffle control
- **THEN** the card order is randomized, each card retains its learned status, and the shuffled deck is persisted

#### Scenario: Shuffle with fewer than two cards
- **WHEN** the user activates the shuffle control while the deck holds 0 or 1 cards
- **THEN** the deck remains unchanged and no error occurs

### Requirement: Restore the default deck
The system SHALL replace the entire current deck with the 4 default Desenvolvimento Web flashcards, reset all learned statuses, and persist the restored deck.

#### Scenario: Restore after edits
- **WHEN** the user activates the restore-defaults control after adding, deleting or completing cards
- **THEN** the deck becomes exactly the 4 default cards, all of them unlearned, the current card resets to the first card, and the result is persisted

### Requirement: Persist deck and learned status
The system SHALL store every card's question, answer and learned flag plus the deck order in `localStorage`, and restore that state on the next visit.

#### Scenario: Reload preserves state
- **WHEN** the user marks cards, reorders or edits the deck and then reloads the page
- **THEN** the deck, the learned flags and the learned count are the same as before the reload

#### Scenario: Corrupted or unavailable storage
- **WHEN** the stored value cannot be parsed or `localStorage` is unavailable
- **THEN** the application falls back to the 4 default cards and continues to function without throwing an unhandled error

### Requirement: Sanitize and bound all card text
The system SHALL sanitize every question and answer at entry and on load — normalizing `\r\n`/`\r` to `\n` and removing control, zero-width and bidirectional-override characters — keep ordinary markup characters as literal text, and cap each text at 600 characters.

#### Scenario: Control and invisible characters are removed
- **WHEN** text containing control characters other than newline, or zero-width and bidi-override characters, is submitted or loaded from storage
- **THEN** those characters are gone from the stored card while `<`, `>` and `&` remain literal text

#### Scenario: Oversized text is truncated
- **WHEN** a question longer than 600 characters is submitted
- **THEN** only its first 600 characters become the card and the deck is persisted normally

### Requirement: Cap the deck size
The system SHALL refuse to add a card once the deck holds 200 cards, showing the friendly warning with shake instead of mutating the deck.

#### Scenario: Add at the cap
- **WHEN** the user submits valid text while the deck already holds 200 cards
- **THEN** no card is added, the warning states the limit, the form shakes, and the app keeps working

### Requirement: Reject oversized stored payloads
The system SHALL discard a stored payload larger than 256 KB before parsing it and clamp a stored deck to its first 200 cards, so tampered storage cannot stall the application.

#### Scenario: Raw payload above the size limit
- **WHEN** the stored value exceeds 256 KB
- **THEN** it is ignored without parsing and the 4 default cards load

#### Scenario: Deck above the card cap
- **WHEN** the stored payload parses but contains more than 200 cards
- **THEN** the first 200 cards load, later cards are dropped, and the app stays responsive
