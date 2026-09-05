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

### Immediate Next Steps
- Sideload/build APK with EAS or test in Expo Go / dev client.
- Test notification tap on device to verify seamless screen routing.

### Completed Work (Current Session - Notification Tap Routing)
- **Notification Tap Screen Navigation**:
  - `src/services/notificationNavigation.ts`: Created `resolveNotificationTarget` and `navigateFromNotification` utilizing `navigationRef` and global notes opener to map any notification (in-app notification or system push notification) directly to the target tab (`TodayTab`, `ChatTab`, `MomentsTab`, `GamesTab`, `CalendarTab`, `CardsTab`, or `NotesTab`).
  - `src/services/notesModalContext.tsx`: Created `NotesModalProvider` and `useNotesModal` hook to allow opening the `NotesScreen` modal from any screen or notification with specific tab targeting (`'gratitude' | 'list' | 'partner'`).
  - `src/components/NotificationCenterModal.tsx`: Fixed tap handler (`handleNotificationPress`) which previously only marked notifications as read without closing the modal or navigating. It now marks as read asynchronously, closes the modal, and routes directly to the relevant screen or notes tab.
  - `src/components/TopAppBar.tsx`: Passed `onNavigateTab` to `NotificationCenterModal` and refactored notes opening to use `useNotesModal()`, eliminating duplicate nested `NotesScreen` mounts.
  - `src/navigation/RootNavigator.tsx`: Attached `navigationRef` to `NavigationContainer` and registered `Notifications.addNotificationResponseReceivedListener` and `getLastNotificationResponseAsync` so tapping remote/system push notifications routes to the appropriate screen automatically.
  - `src/features/games/GamesScreen.tsx`: Added support for `route.params.gameId` to open the specific challenged game directly upon tapping game notifications.
  - `src/features/moments/MomentsFeedScreen.tsx`: Added support for `route.params.action === 'snap'` to automatically trigger the new moment photo composer when tapping a photo prompt/nudge.
  - `src/services/useNotifications.ts`: Attached route data (`ChatTab`, `NotesTab`, `MomentsTab`) to sent nudges.

### Completed Work (Current Session)
- **Resolved Notification Errors & Require Cycle**:
  - `src/services/notificationService.ts`: Added Expo Go environment detection (`Constants.executionEnvironment === ExecutionEnvironment.StoreClient`) on Android to avoid the SDK 53+ uncatchable native error banner when attempting to call `getExpoPushTokenAsync` in Expo Go, while preserving full remote push support for standalone / dev builds.
  - `src/features/notes/NotesScreen.tsx`: Replaced barrel imports from `../../components` with direct component imports, eliminating the require cycle `src/components/index.ts -> TopAppBar.tsx -> NotesScreen.tsx -> src/components/index.ts`.
  - `scripts/timeSync.js`: Created clock-skew synchronization helper for Firebase Admin SDK scripts to compensate for system clock discrepancies when exchanging OAuth JWTs with Google's servers.
  - `src/services/useNotifications.ts`: Removed `orderBy('createdAt', 'desc')` from the query and sorted client-side by timestamp in memory, completely eliminating the Firestore composite index error (`[FirebaseError: The query requires an index]`).
  - `firestore.indexes.json`: Added `notifications` index configuration (`recipientUid ASC`, `createdAt DESC`).
  - `src/features/dailyQuestion/useDailyQuestion.ts`: Decoupled the partner answer subscription from component mount so that it dynamically subscribes when `hasMyAnswer` is true. Previously, attempting to listen to the partner's answer on mount before answering violated Firestore security rules, which terminated the listener and prevented revealing the partner's answer without reloading. Also added immediate fetch of the partner's answer on `submitAnswer` for zero-lag instant reveal.
  - `src/features/dailyQuestion/DailyQuestionScreen.tsx`: Updated toast to announce instant reveals when the partner has already answered.
  - `src/features/chat/ChatScreen.tsx`: Fixed input hidden under keyboard on Android with `KeyboardAvoidingView` height behavior, and trimmed idle composer padding from `88 + insets.bottom` down to `58 + insets.bottom` (and reduced `paddingTop` from `24` to `8`) to eliminate the dead floating space above the bottom navigation bar.
  - `src/navigation/RootNavigator.tsx`: Added `Keyboard` listener to `CustomTabBar` so the bottom tab bar hides when the keyboard opens and restores when closed.
- **Games Vertical Scrolling & Bottom Navigation Clearance**:
  - `src/features/games/tictactoe/TicTacToeScreen.tsx`: Wrapped game body (mode switcher, scoreboard, grid, dare banner, and actions) in a `ScrollView` with fixed header and `paddingBottom: 100 + insets.bottom`. Now the dare message, "Share", and "Next Round" buttons can be scrolled to easily on any device and sit comfortably above the navigation bar.
  - `src/features/games/chess/ChessGameScreen.tsx`: Wrapped game body and victory forfeit card in `ScrollView` with `paddingBottom: 100 + insets.bottom`, keeping header fixed.
  - `src/features/games/checkers/CheckersScreen.tsx`: Wrapped board and controls in `ScrollView` with `paddingBottom: 100 + insets.bottom`, keeping header fixed.
  - `src/features/games/seaBattle/SeaBattleScreen.tsx`: Wrapped setup, playing, and game-over screens in `ScrollView` with `paddingBottom: 100 + insets.bottom`.
  - `src/features/games/word/WordGameScreen.tsx`: Wrapped grid and game status result banner in `ScrollView` with `paddingBottom: 100 + insets.bottom`. In addition, only render the virtual keyboard while `gameStatus === 'playing'` so that upon completion, the victory/defeat banner and "Share to Chat" / "Play Next Word" buttons have full view.
  - `src/features/games/truthOrDare/TruthOrDareScreen.tsx`: Added dynamic bottom insets (`100 + insets.bottom`) and `flexGrow: 1` to `scrollContent`.
  - `src/features/games/trivia/CoupleTriviaScreen.tsx`: Added dynamic bottom insets (`100 + insets.bottom`) and `flexGrow: 1` to `scrollContent`.
  - `src/features/games/twoTruths/TwoTruthsScreen.tsx`: Added dynamic bottom insets (`100 + insets.bottom`) and `flexGrow: 1` to all scrollable phases.
  - `src/features/games/hotTakes/HotTakesScreen.tsx`: Added dynamic bottom insets (`100 + insets.bottom`) and `flexGrow: 1` to all scrollable phases.
  - `src/features/games/tapBattle/TapBattleScreen.tsx`: Added `paddingBottom: 80 + insets.bottom` to the content container.
- **Verification**:
  - Clean TypeScript check (`tsc --noEmit` exits with 0 errors).
  - All 11 test suites passing (69/69 tests).


