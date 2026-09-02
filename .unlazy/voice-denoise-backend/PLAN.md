# Unlazy Execution Plan: Voice Denoise Backend

## 1. Scope
- Package: `backend/`
- Runtime: Node.js + TypeScript
- Target: Standalone microservice containerized for OCI Always Free ARM64 (Ampere A1)
- Core Function: Download raw audio from Cloudinary, authenticate Firebase ID token, apply FFmpeg `afftdn` broadband hiss reduction and `loudnorm` normalization, upload cleaned `.m4a` to Cloudinary via server-side API secret, return cleaned audio URL.

## 2. Tasks & Milestones
- [x] **Milestone 1**: Ledger & Gate Definitions (`.unlazy/voice-denoise-backend/`)
- [x] **Milestone 2**: Backend Project Setup (`backend/package.json`, `tsconfig.json`, `README.md`, `.dockerignore`, `.env.example`)
- [x] **Milestone 3**: Core Logic Implementation
  - `src/validation.ts`: Zod schema validation for Cloudinary domain, coupleId, duration, payload limits.
  - `src/auth.ts`: Firebase Admin ID token authentication middleware.
  - `src/cloudinary.ts`: Cloudinary download and server-side signed upload helper.
  - `src/processAudio.ts`: FFmpeg audio processing engine (`afftdn`, `loudnorm`, `highpass`, `lowpass`) with strict cleanup.
  - `src/server.ts`: Express application with `/health` and `POST /v1/audio/process`.
- [x] **Milestone 4**: Automated Test Suites (`backend/tests/`)
  - Validation unit tests
  - Auth middleware unit tests
  - Audio processing unit tests with synthetic/sample audio
  - Express server integration tests
- [x] **Milestone 5**: Containerization Setup (`Dockerfile`, `docker-compose.yml`)
- [x] **Milestone 6**: Client Service Integration (`src/services/voiceNoteService.ts`, `useChat.ts`)
- [x] **Milestone 7**: Gate Execution and Verification (7/7 gates verified)
