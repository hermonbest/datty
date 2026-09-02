# Acceptance Gates: Server-Side Voice Note Post-Processing

## Ledger Summary
- Scope: `voice-note-post-processing`
- Target: Firebase Cloud Functions + Expo React Native Client

---

### Gate 1: Cloud Functions Project Scaffolding and Dependencies
- **Outcome**: `functions/` directory is configured with TypeScript, `firebase-functions`, `firebase-admin`, `fluent-ffmpeg`, `ffmpeg-static`, `cloudinary`, and compiles cleanly.
- **Type**: Runnable
- **CHECK**: `cd functions && npm run build`
- **EXPECT**: Exit code 0, no TypeScript compilation errors.

---

### Gate 2: ffmpeg-static Binary Validation
- **Outcome**: `ffmpeg-static` path resolves to a valid executable and runs `-version` successfully without errors.
- **Type**: Runnable
- **CHECK**: `node -e "const ffmpeg = require('ffmpeg-static'); const { execSync } = require('child_process'); console.log(execSync(ffmpeg + ' -version').toString().slice(0, 30));"`
- **EXPECT**: `ffmpeg version`

---

### Gate 3: processVoiceNote Cloud Function Implementation & Error Handling
- **Outcome**: `functions/src/processVoiceNote.ts` is implemented with input validation, `/tmp` file handling, fluent-ffmpeg audio filter chain (`highpass=80,lowpass=7500,afftdn=nr=25:nf=-45,loudnorm=I=-16:TP=-1.5:LRA=11`), fallback upload to Cloudinary on ffmpeg failure, and `/tmp` silent cleanup in `finally`.
- **Type**: Runnable
- **CHECK**: `cd functions && npx tsc --noEmit`
- **EXPECT**: Exit code 0, no type errors.

---

### Gate 4: Client-Side Integration with Graceful Fallback
- **Outcome**: `src/features/chat/useChat.ts` calls `processVoiceNote` via Firebase callable functions with base64 audio payload, maintains `isStoppingRecording` during upload, and falls back to existing `uploadFileToCloudinary` on any network/server failure.
- **Type**: Runnable
- **CHECK**: `npm run typecheck`
- **EXPECT**: Exit code 0, clean TypeScript check across the Expo app.

---

### Gate 5: End-to-End Voice Note Audio Quality & Resilience (Manual Acceptance)
- **Outcome**:
  1. Record a note with ~2s silence → silence noise floor is removed/reduced.
  2. Voice note loudness normalized to ~ -16 LUFS without distortion/clipping.
  3. Server ffmpeg fault test → falls back to uploading original audio.
  4. Client network fault to function test → falls back to direct Cloudinary raw upload.
  5. Playback continues to work seamlessly on device.
- **Type**: Manual
- **EXPECT**: All 5 manual scenarios verified on physical Android/iOS device.
