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

### Completed Work (Current Session - Systematic Caching System)
- **Systematic Caching for Instant Responsiveness**:
  - `src/services/cache.ts`: Created zero-dependency two-tier cache engine (Tier 1 synchronous in-memory `Map` for 0ms frame rendering + Tier 2 persistent `@react-native-async-storage/async-storage` for cold starts). Provides `getMemory`, `get`, `set`, `remove`, `clear`, and `clearMemory` with TTL support and typed `CacheKeys`.
  - `src/services/imageCache.ts`: Created disk image cache utility using `expo-file-system/legacy` (`FileSystem.cacheDirectory + 'img_cache/'`) with zero-dependency deterministic DJB2 hashing (`hashUri`), background downloading (`downloadAsync`), and `useCachedImageUri` React hook.
  - `src/components/CachedImage.tsx`: Created drop-in replacement for `<Image>` with disk caching and smooth fallback to remote URI.
  - `src/services/coupleContext.tsx`: Hydrates `userProfile`, `couple`, and `partnerProfile` from disk cache on app launch, setting `loading = false` instantly to eliminate cold-start splash screen waiting. Empties cache on `signOut`.
  - `src/features/notes/useNotes.ts`: Cached `coupleNotes` and `partnerNotes` for instant 0ms Notes modal opening without loading spinner.
  - `src/features/moments/useMoments.ts`: Cached moments list for instant 0ms feed display on tab switch.
  - `src/features/calendar/useEvents.ts`: Cached couple events list for instant calendar view.
  - `src/features/chat/useChat.ts`: Cached recent messages for instant chat screen loading.
  - `src/features/cards/useDeckAnswers.ts`: Cached deck answer entries and progress for instant card decks opening.
  - `src/services/useNotifications.ts`: Cached notifications list for instant bell badge count and notification center opening.
  - `src/components/Avatar.tsx` & `MomentsFeedScreen.tsx` & `ChatScreen.tsx`: Updated avatars, moment photos, and chat photo bubbles to use `CachedImage` for local disk caching.
  - `tests/cache.test.ts`: Added comprehensive unit tests covering memory hit/miss, AsyncStorage fallback, TTL expiration, prefix clearing, corrupt JSON handling, and image URI hashing.
- **Verification**:
  - All 13 test suites passing (82/82 tests).
  - Clean TypeScript check (`tsc --noEmit` exits with 0 errors).

### Completed Work (Current Session - In-App & Mobile Notifications + Deprecation Fixes)
- **Collapsed Chat Notifications & Push Grouping**:
  - `src/services/notificationService.ts`: Added `tag`, `collapseId`, and `threadId` support to `sendPushNotification`. For chat notifications, deterministically writes to `couples/{coupleId}/notifications/chat_${recipientUid}` so incoming messages update the existing unread card rather than accumulating duplicate entries. Added push tags `chat_${coupleId}` and `game_${gameId}`.
  - `src/features/chat/ChatScreen.tsx`: Added auto-mark as read for `chat_${myUid}` on screen focus so opening the chat clears the unread badge and notification.
- **Turn Notifications in Multiplayer Games**:
  - `src/services/notificationService.ts`: Added `notifyGameTurn()` helper and registered Android notification channel `'game-alerts'` with high importance and vibration.
  - Connected `notifyGameTurn` on move/turn-end across:
    - `src/features/games/seaBattle/SeaBattleScreen.tsx` (fleet setup submission and attack guesses)
    - `src/features/games/tictactoe/useTicTacToe.ts` (grid moves)
    - `src/features/games/chess/useChessGame.ts` (chess board moves)
    - `src/features/games/checkers/CheckersScreen.tsx` (checkers piece moves)
    - `src/features/games/word/WordGameScreen.tsx` (word guess submissions)
    - `src/features/games/twoTruths/TwoTruthsScreen.tsx` (statements submission and guessing)
- **Interactive In-App Toast & Mobile Device System Notifications**:
  - `src/components/Toast.tsx`: Added `onPress` callback and close button to `ToastMessage` and `ToastContextValue`, allowing in-app toast banners to be tapped for instant navigation.
  - `src/navigation/RootNavigator.tsx`: Added a real-time Firestore listener on `couples/{coupleId}/notifications` for unread items directed at `myUid`:
    1. Pops an in-app interactive `toast.info(title, body, onPress)` on the user's screen with direct navigation to the game or chat via `resolveNotificationTarget`.
    2. Calls `Notifications.scheduleNotificationAsync({ identifier: doc.id, content: ..., trigger: null })` so a standard Android system notification is posted to the phone's notification bar/drawer, functioning in Expo Go as well as standalone/dev builds.
- **Deprecation Warnings Eliminated**:
  - Removed deprecated `shouldShowAlert` in favor of `shouldShowBanner` and `shouldShowList`.
  - Replaced deprecated `SafeAreaView` from `'react-native'` with `SafeAreaView` from `'react-native-safe-area-context'` across all game screens (`SeaBattleScreen`, `CheckersScreen`, `WordGameScreen`, `TwoTruthsScreen`, `TicTacToeScreen`, `TapBattleScreen`, `HotTakesScreen`, `TruthOrDareScreen`, `CoupleTriviaScreen`, and `GamesScreen`).
- **Verification**:
  - All 13 test suites passing (83/83 tests).
  - TypeScript check (`tsc --noEmit`) passes with 0 errors.

- **In-App Foreground Presentation (OS System Notification Suppression)**:
  - Configured `Notifications.setNotificationHandler` with `shouldShowBanner: false`, `shouldShowList: false`, and `shouldPlaySound: false` so that while the app is active in the foreground, Android/iOS system drawers and sounds do not duplicate alerts.
  - In `RootNavigator.tsx`, displays solely the custom in-app interactive toast message when the app is open, reserving OS notifications for when the app is backgrounded or closed.


