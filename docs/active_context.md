# Active Context

## Current Status: Couple Notes & Private Partner Cheat Sheet Feature (Completed)

### Completed Work
- **Implemented Notes Feature per Option B (`implementation_plan.md`)**:
  - `src/types/index.ts`: Added `CoupleNote`, `CoupleNoteType`, and `PartnerNote` data interfaces.
  - `firestore.rules`: Configured security isolation — `/couples/{coupleId}/notes/{noteId}` allows couple members; `/users/{uid}/partnerNotes/{noteId}` strictly enforces `isMe(uid)` so partner cannot read private notes.
  - `src/features/notes/notesLogic.ts`: Pure utilities for validation, sorting, filtering, and partner cheat-sheet suggested prompt chips.
  - `src/features/notes/useNotes.ts`: Real-time hook with `onSnapshot` for shared couple notes and private partner notes.
  - `src/features/notes/NotesScreen.tsx`: 3-tab segmented interface (Shared Gratitude, Shared Couple List, Private Partner Notes with private indicator banner and edit/delete).
  - `src/components/TopAppBar.tsx` & `src/components/index.ts`: Added `BookOpen` icon in persistent header to open `NotesScreen` as a full modal screen, preserving exactly 6 bottom tabs.
  - `tests/notesLogic.test.ts`: Added comprehensive unit tests covering validation, category tagging, completion toggling, and sorting.
- **Verification**:
  - All 10 test suites passing (58/58 tests).
  - Clean TypeScript check (`tsc --noEmit` exits with 0 errors).

### Immediate Next Steps
- **Notifications System (Feature-Specific & App Nudges)**:
  - Plan created in `implementation_plan.md` categorizing notifications into Feature-Specific (Daily Question, Moments, Chat, Calendar, Notes, Games) and App Nudges (Daily Morning Note, Evening Gratitude, Spontaneous "What are you doing now?" photo prompt, Partner Nudges).
  - Awaiting user review and approval before beginning Phase 1 implementation.
- Implement logic and tests for the 5 new games if needed in the future.

### Completed Work (Current Session)
- **Implemented 5 Lightweight Mini-Games**:
  - `src/types/games.ts`: Added `tap_battle`, `two_truths`, `hot_takes`, `sea_battle`, `checkers`.
  - `src/features/games/tapBattle/TapBattleScreen.tsx`: Synchronous 5s reflex tapping game.
  - `src/features/games/twoTruths/TwoTruthsScreen.tsx`: Asynchronous statement guessing.
  - `src/features/games/hotTakes/HotTakesScreen.tsx`: Blind rating of bold statements.
  - `src/features/games/seaBattle/SeaBattleScreen.tsx`: 5x5 Battleship-lite.
  - `src/features/games/checkers/CheckersScreen.tsx`: Simplified 8x8 Checkers.
  - `src/features/games/GamesScreen.tsx`: Added all 5 games to the `GAMES` list and added routing logic.

