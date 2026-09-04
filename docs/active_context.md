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

## Feature: Multiplayer Dream-House Game (Completed on feat/dream-house)
- **Status:** Fully implemented and verified on branch `feat/dream-house`.
- **Completed Work**:
  - `src/types/games.ts`: Added `'dream_house'` to `GameId` and created interfaces for `DreamHouseItemTemplate`, `DreamHousePlacedItem`, `DreamHouseRoom`, `DreamHouseLock`, `DreamHouseLiveMove`, and `DreamHouseLiveSync`.
  - `src/features/games/dreamHouse/dreamHouseLogic.ts`: Pure isometric coordinate math (`gridToScreen`, `screenToGrid`), grid bounds checking, depth z-index calculation, pessimistic locking logic with automatic 30s expiry fallback, and cozy furniture catalog.
  - `src/features/games/dreamHouse/useDreamHouse.ts`: Real-time hybrid synchronization hook. Uses Firestore (`couples/{coupleId}/games/dream_house`) for permanent room layouts and Firebase RTDB (`couples/{coupleId}/games/dream_house/sync`) for ephemeral locks (`onDisconnect().remove()`) and live ghost drag streaming.
  - `src/features/games/dreamHouse/IsometricGrid.tsx`: Pixel-perfect SVG polygon isometric floor tiles and cozy walls.
  - `src/features/games/dreamHouse/DraggableFurniture.tsx`: React Native `PanResponder` + `Animated` 60fps drag-and-drop with snap-to-grid, partner lock indicators, and live ghost drag rendering.
  - `src/features/games/dreamHouse/CatalogModal.tsx`: Categorized furniture catalog drawer with cozy palettes and icons.
  - `src/features/games/dreamHouse/DreamHouseScreen.tsx`: Game canvas with header presence indicators, real-time collaboration status, reset room, and catalog triggers.
  - `src/features/games/GamesScreen.tsx`: Integrated Dream Sanctuary featured hero card into the Games hub.
  - `tests/dreamHouseLogic.test.ts`: 11 unit tests covering projection math, roundtrip coordinate transforms, rotation, clamping, z-index layering, and pessimistic lock concurrency.
- **Verification:**
  - 11/11 test suites passing (69/69 tests total).
  - TypeScript type check (`tsc --noEmit`) passes with 0 errors.
  - Master branch remains untouched.

