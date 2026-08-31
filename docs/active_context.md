# Active Context

## Current Status: Android Audio Quality, Noise Suppression & Volume (Completed)

### Completed Fixes
- **Research & Android Best Practices**: Researched official Android audio framework documentation (`MediaRecorder`, `AudioAttributes`, `AudioManager`, and `ExoPlayer/Media3`).
- **Eliminated "shhh" Noise & Low Mic Gain**: Updated `patches/expo-audio+0.3.5.patch` to use `MediaRecorder.AudioSource.VOICE_COMMUNICATION`. This engages the Android hardware acoustic processing pipeline (Hardware `NoiseSuppressor` and `AutomaticGainControl`) to suppress background hiss and boost voice loudness naturally.
- **Fixed Low Playback Volume**: Configured ExoPlayer in `AudioPlayer.kt` with `C.USAGE_MEDIA` + `C.AUDIO_CONTENT_TYPE_SPEECH` and `player.volume = 1.0f`, ensuring the playback stream utilizes the device's main loudspeaker at full media volume.
- **Optimized ChatScreen**: Updated `RECORDING_OPTIONS` in `src/features/chat/ChatScreen.tsx` to 44.1kHz / 128kbps mono AAC-LC and enforced `player.volume = 1.0` during playback.
- **Verification**: Verified via `npm run typecheck` (0 errors) and `npm test` (44/44 tests passed).
