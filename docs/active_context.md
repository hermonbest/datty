# Active Context

## Current Status: Notifications & Love Nudges System (Completed)

### Completed Work
- **Implemented Notifications System**:
  - `src/types/notifications.ts`: Added `NotificationType`, `AppNotification`, `NotificationPreferences`, and defaults.
  - `app.config.ts`: Configured `expo-notifications` plugin with custom icon and colors.
  - `firestore.rules`: Permitted `/couples/{coupleId}/notifications/{notifId}` for couple members.
  - `src/services/notificationLogic.ts`: Pure utilities for quiet hours calculation, daily habit scheduling, cooldown throttling, and copy formatting.
  - `src/services/notificationService.ts`: Push token registration to Firestore (`users/{uid}/expoPushToken`), direct client-to-client push dispatcher via Expo Push API, local recurring habit scheduler, and Android notification channels.
  - `src/services/useNotifications.ts`: Real-time subscription hook for in-app notification center, unread badge count, preferences sync, and throttled nudges.
  - `src/features/dailyQuestion/useDailyQuestion.ts`: Dispatches `daily_answered` or `daily_revealed` on submit.
  - `src/features/moments/useMoments.ts`: Dispatches `moment_new` on photo upload.
  - `src/features/chat/useChat.ts`: Dispatches `chat_message` on text, photo, or audio message.
  - `src/features/notes/useNotes.ts` & `NotesScreen.tsx`: Dispatches `note_gratitude` and `note_list_item`; added "Nudge Partner" button in header.
  - `src/components/TopAppBar.tsx`: Added notification bell with live unread counter badge and one-tap "Thinking of you" heart pulse button.
  - `src/components/NotificationCenterModal.tsx`: Notification history center modal with filter tabs ("All", "Love Nudges", "Activity"), quick nudge buttons, and mark all as read.
  - `src/components/NotificationSettingsModal.tsx`: Granular preference toggles for partner activities, daily habits (morning note, evening gratitude, daily question, spontaneous photo), and quiet hours.
  - `tests/notificationLogic.test.ts`: Added 9 unit tests covering quiet hours, scheduling, cooldowns, and copy.
- **Verification**:
  - All 11 test suites passing (69/69 tests).
  - Clean TypeScript check (`tsc --noEmit` exits with 0 errors).

### Immediate Next Steps
- Sideload/build APK with EAS or test in Expo Go / dev client.
- Implement logic and tests for remaining mini-games if needed in the future.

### Completed Work (Current Session)
- **Implemented 5 Lightweight Mini-Games**:
  - `src/types/games.ts`: Added `tap_battle`, `two_truths`, `hot_takes`, `sea_battle`, `checkers`.
  - `src/features/games/tapBattle/TapBattleScreen.tsx`: Synchronous 5s reflex tapping game.
  - `src/features/games/twoTruths/TwoTruthsScreen.tsx`: Asynchronous statement guessing.
  - `src/features/games/hotTakes/HotTakesScreen.tsx`: Blind rating of bold statements.
  - `src/features/games/seaBattle/SeaBattleScreen.tsx`: 5x5 Battleship-lite.
  - `src/features/games/checkers/CheckersScreen.tsx`: Simplified 8x8 Checkers.
  - `src/features/games/GamesScreen.tsx`: Added all 5 games to the `GAMES` list and added routing logic.

