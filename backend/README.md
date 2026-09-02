# Voice Denoise Backend

Standalone audio denoising microservice built with **Node.js**, **TypeScript**, and **FFmpeg**.

It ingests voice notes recorded by the Datty mobile client, verifies Firebase authentication, validates Cloudinary provenance, applies adaptive FFT noise reduction (`afftdn`) and loudness normalization (`loudnorm`), uploads the cleaned `.m4a` to Cloudinary via server-side API secrets, and returns the optimized URL.

---

## Architecture & Flow

```
Mobile Client (Datty)
   │  1. Unsigned upload raw recording
   ▼
Cloudinary (Storage)
   │  2. POST /v1/audio/process (sourceUrl, coupleId) + Bearer <Firebase ID Token>
   ▼
Voice Denoise Backend (OCI ARM64 VM)
   ├── 3. Verify Firebase ID token
   ├── 4. Validate Cloudinary domain & couple folder
   ├── 5. Download audio to temporary scratch file
   ├── 6. FFmpeg filter chain: highpass(80Hz) + lowpass(7.5kHz) + afftdn(20dB) + loudnorm(-16 LUFS)
   ├── 7. Server-side signed upload to Cloudinary (resource_type: 'video', format: 'm4a')
   ├── 8. Guaranteed cleanup of all temp files
   └── 9. Return { audioUrl, processingVersion: 'afftdn-v1' }
```

---

## API Specification

### Health Check

```http
GET /health
POST /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "voice-denoise-backend",
  "timestamp": "2026-09-02T14:30:00.000Z",
  "uptimeSeconds": 1420
}
```

---

### Process Audio

```http
POST /v1/audio/process
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sourceUrl": "https://res.cloudinary.com/your-cloud/video/upload/v12345/datty/couple-xyz/chat/raw.m4a",
  "coupleId": "couple-xyz",
  "durationSeconds": 14.5
}
```

**Response (200 OK):**
```json
{
  "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v12346/datty/couple-xyz/chat/cleaned.m4a",
  "processingVersion": "afftdn-v1",
  "duration": 14.5,
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP listening port | No (Default: 3000) | `3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | **Yes** | `datty-cloud` |
| `CLOUDINARY_API_KEY` | Server-side Cloudinary API Key | **Yes** | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Server-side Cloudinary API Secret | **Yes** | `abcdef1234567890` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Single-line JSON service account string | Either A | `{"type":"service_account",...}` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Or B | `datty-40e3b` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | Or B | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key | Or B | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `MAX_DURATION_SECONDS` | Maximum allowed voice duration in seconds | No (Default: 300) | `300` |
| `MAX_FILE_SIZE_MB` | Maximum allowed audio file size | No (Default: 25) | `25` |

---

## Local Development & Testing

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Run TypeScript typecheck
npm run typecheck

# 3. Run test suites
npm test

# 4. Start local development server with hot-reload
npm run dev
```

---

---

## Free Hosting Alternatives (Render & Koyeb)

If Oracle Cloud account creation is blocked or unavailable, you can deploy the Docker container to **Koyeb** or **Render** for free with zero credit card issues.

---

### Option A: Deploy on Koyeb (Recommended Free Tier)

1. Sign up for free at [koyeb.com](https://www.koyeb.com).
2. Click **Create Service** -> Choose **GitHub**.
3. Select your repository.
4. Set:
   - **Root directory**: `backend`
   - **Build type**: `Dockerfile`
   - **Exposed port**: `3000`
5. Under **Environment variables**, add:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
   - `NODE_ENV` = `production`
6. Click **Deploy**. Koyeb will build the Docker container and give you a public HTTPS URL (e.g. `https://voice-denoise-xxxx.koyeb.app`).
7. Add this URL to your app's `.env` as `EXPO_PUBLIC_AUDIO_BACKEND_URL=https://voice-denoise-xxxx.koyeb.app`.

---

### Option B: Deploy on Render

1. Sign up for free at [render.com](https://render.com).
2. Click **New +** -> **Web Service** -> Connect your GitHub repo.
3. Choose **Docker** as the runtime:
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
   - **Instance Type**: **Free**
4. Under **Environment Variables**, add the variables from `.env.example`.
5. Click **Create Web Service**. Render will provision an HTTPS endpoint (e.g. `https://voice-denoise-backend.onrender.com`).
6. Set `EXPO_PUBLIC_AUDIO_BACKEND_URL=https://voice-denoise-backend.onrender.com` in your app's `.env`.

---

## OCI Always Free ARM Deployment Guide (If Available Later)

### 1. Provision VM
- Compute -> Instances -> Create Instance
- Image: **Ubuntu 22.04 / 24.04 ARM (aarch64)**
- Shape: **Ampere VM.Standard.A1.Flex** (e.g. 2 OCPUs, 12GB RAM - Always Free tier)
- Attach your SSH public key.

### 2. Install Docker & Docker Compose on OCI VM
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Deploy Service
```bash
# Clone repository or copy backend directory
cd /opt/voice-denoise-backend

# Configure production .env
nano .env

# Build and start container with restart policy
docker compose up -d --build

# Verify container status and logs
docker compose ps
docker compose logs -f
```

### 4. Setup Caddy (Automatic HTTPS Reverse Proxy)
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Edit /etc/caddy/Caddyfile:
# audio.yourdomain.com {
#     reverse_proxy localhost:3000
# }

sudo systemctl restart caddy
```
