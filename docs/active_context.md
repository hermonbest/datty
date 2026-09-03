# Active Context

## Current Status: Pure Official Expo Audio Stabilization & Repo Cleanup (Completed)

### Completed Work
- **Root Cause Analysis & Elimination of Audio Hiss / Noise**:
  - Found that Android VoIP AGC / `audioSource: 'voice_communication'` was aggressively boosting microphone preamp gain during pauses (+30 dB), generating loud white noise / hiss pumping.
  - Found Cloudinary was detecting `.m4a` files uploaded under the `video` resource type as 3GPP and compressing them into **8,000 Hz / 1.7 kbps AMR-NB 3GP format**, severely degrading voice quality.
- **Pure Official Expo Audio Adoption in Chat**:
  - In `src/features/chat/ChatScreen.tsx`, adopted the official `useAudioRecorder(RecordingPresets.HIGH_QUALITY)` and `useAudioRecorderState` hooks directly.
  - Simplified global audio configuration to `setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })` matching official Expo Audio documentation, removing `interruptionMode: 'doNotMix'` and conflicting mode toggles.
- **Bit-for-Bit Cloudinary Raw Storage**:
  - Configured `src/services/voiceNoteService.ts` and `src/services/fileToBytes.ts` to upload `.m4a` audio files as `raw` with explicit `filename_override`.
  - Preserves 100% of the original 44.1 kHz AAC studio audio byte-for-byte with 0 server-side transcoding or bitrate loss.
- **Repo Cleanup & Over-Engineering Removal (Ponytail)**:
  - Deleted obsolete backend FFmpeg microservice directory (`backend/`) and `.unlazy/` ledgers (cutting over 9,400 lines of unneeded complexity).
  - Removed temporary `AudioComparison` diagnostic panel and temporary `Mic Test` tab.
  - All test suites passing (44/44 tests across 9 suites), 0 TypeScript errors (`tsc --noEmit`).
- **Merged to Master**:
  - Feature branch `fix/voice-hiss-reduction` successfully merged into `master`.

### Immediate Next Steps
- Continue with app features or couples chat enhancements as directed.
