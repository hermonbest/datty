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
- Merge `feat/notes-and-cheat-sheet` branch to `master` or deploy firestore rules via `npm run deploy:firestore-rules`.

## Feature Plan: Multiplayer Dream-House Game
- **Scope:** Large. A full 2.5D isometric game subsystem running inside the Expo app.
- **Edge cases evaluated:** Concurrent drag conflicts, z-index sorting of overlapping furniture, state desync on poor connections, UI thread performance with many items.
- **Options presented:**
  - *Option A (Recommended):* React Native Reanimated for 60fps gesture rendering + Firebase RTDB for lock-based drag sync. Simple, performs well for casual 2D grids, agent-friendly.
  - *Option B:* React Native Skia + Yjs (CRDT). Highly performant rendering and true conflict-free state resolution, but significantly increases complexity for an AI to maintain.
- **Next Actions:** Awaiting user approval to proceed with Phase 1 (Foundation & Local Grid Setup).

