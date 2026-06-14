# Security Specification

## Data Invariants
1. An Epreuve must have a valid string name.
2. A Competitor must have all required string fields.
3. A FrameLog must have a valid timestamp and hex string.
4. Only authenticated users can read, create, update, or delete data.

## The "Dirty Dozen" Payloads
1. `Competitor` create missing `firstName`.
2. `Competitor` create with `firstName` as an object instead of string.
3. `Competitor` update injecting a `ghostField`.
4. `Epreuve` create missing `name`.
5. `Epreuve` create with `disciplines` too large (e.g., > 100).
6. `Epreuve` update inserting invalid `ghostField`.
7. `FrameLog` create missing `timestamp`.
8. `FrameLog` create missing `hexData`.
9. `FrameLog` update attempting to modify `timestamp`.
10. Unauthenticated read of `competitors`.
11. Unauthenticated write of `epreuves`.
12. Creating a document with an ID longer than 128 chars.
