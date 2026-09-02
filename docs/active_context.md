# Active Context

## Current Status: Expo SDK 54 Upgrade & expo-audio 1.1 Stabilization (Completed)

### Completed Work
- **Server-Side Voice Note Post-Processing**:
  - Implemented Firebase HTTPS Callable Cloud Function (`functions/src/processVoiceNote.ts`) using `fluent-ffmpeg` and `ffmpeg-static` with filter chain `highpass=80,lowpass=7500,afftdn=nr=25:nf=-45,loudnorm=I=-16:TP=-1.5:LRA=11` (-c:a aac, 96kbps, 48kHz mono).
  - Configured Cloudinary upload with `resource_type: 'video'`.
  - Implemented dual-layer fallback:
    1. Server fallback: on ffmpeg failure, uploads raw audio to Cloudinary instead of throwing.
    2. Client fallback: on Cloud Function network/server error, `processAndUploadVoiceNote` falls back directly to `uploadFileToCloudinary`.
  - Added unit test suite `tests/voiceNoteService.test.ts` (10/10 suites passing, 47/47 tests).
  - Verified `ffmpeg-static` binary execution (`ffmpeg version 6.1.1`).
  - Verified clean TypeScript compilation in both `functions/` and root app.
- **Expo SDK 54 Upgrade**: Upgraded Expo and aligned dependencies to Expo SDK 54 (`expo@^54.0.0`, `expo-audio@~1.1.1`, `expo-asset@~12.0.13`, `expo-clipboard@~8.0.8`, `expo-constants@~18.0.14`, `expo-dev-client@~6.0.21`, `expo-file-system@~19.0.24`, `expo-image-picker@~17.0.11`, `expo-secure-store@~15.0.8`, `expo-status-bar@~3.0.9`, `expo-font@~14.0.10`, `react@19.1.0`, `react-native@0.81.5`, `react-native-gesture-handler@~2.28.0`, `react-native-safe-area-context@~5.6.0`, `react-native-screens@~4.16.0`, `react-native-svg@15.12.1`).
- **Removed Native Patch & patch-package**: Deleted `patches/expo-audio+0.3.5.patch`, removed `patch-package` devDependency and `"postinstall": "patch-package"` script from `package.json`.
- **Legacy Architecture Configuration**: Explicitly configured `newArchEnabled: false` in `app.config.ts` to preserve compatibility and prevent Metro module resolution issues with Firebase JS SDK v11.4.0. Added `expo-font` to `plugins`.
- **ChatScreen Audio Update**: Updated `useAudioPlayer(audioSource, { updateInterval: 200 })` to match Expo SDK 54 API, verified `RECORDING_OPTIONS` (44.1kHz AAC-LC mono at 128kbps), and cleaned up obsolete patch diagnostic comments.
- **fileToBytes Update**: Updated `expo-file-system` import to `expo-file-system/legacy` for backwards compatibility with `uploadAsync`, `readAsStringAsync`, and `getInfoAsync`.

### Immediate Next Steps
- Deploy Cloud Functions (`cd functions && npm run deploy` or `firebase deploy --only functions`) to Firebase project `datty-40e3b` (ensuring Blaze plan).
- Perform manual acceptance testing on physical Android/iOS devices per `GATES.md`.

