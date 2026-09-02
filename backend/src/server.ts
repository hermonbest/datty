import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

dotenv.config();

import { authenticateFirebaseToken, AuthenticatedRequest } from './auth';
import { validateAudioProcessPayload } from './validation';
import { downloadAudioFile, uploadProcessedAudio } from './cloudinary';
import { runFFmpegDenoise, cleanupFiles } from './processAudio';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Structured Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomUUID();
  (req as any).requestId = requestId;

  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: _res.statusCode,
        durationMs: duration,
      })
    );
  });
  next();
});

// Health Endpoints
const handleHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'voice-denoise-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
};

app.get('/health', handleHealth);
app.post('/health', handleHealth);

// Audio Processing Endpoint
app.post('/v1/audio/process', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const requestId = (req as any).requestId || randomUUID();
  console.log(`[ProcessAudio] Processing request ${requestId} for user ${req.user?.uid}`);

  // 1. Validate payload
  const validation = validateAudioProcessPayload(req.body);
  if (!validation.success || !validation.data) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid request payload',
      details: validation.errors,
    });
    return;
  }

  const { sourceUrl, coupleId, durationSeconds } = validation.data;

  const tempDir = os.tmpdir();
  const rawFilePath = path.join(tempDir, `raw-${requestId}.m4a`);
  const processedFilePath = path.join(tempDir, `proc-${requestId}.m4a`);

  try {
    // 2. Download raw audio from Cloudinary
    console.log(`[ProcessAudio] Downloading source audio from: ${sourceUrl}`);
    await downloadAudioFile(sourceUrl, rawFilePath);

    // 3. Process audio via FFmpeg
    console.log(`[ProcessAudio] Running FFmpeg denoise and normalization on request ${requestId}`);
    await runFFmpegDenoise(rawFilePath, processedFilePath);

    // 4. Upload cleaned .m4a to Cloudinary
    const targetFolder = `datty/${coupleId}/chat`;
    console.log(`[ProcessAudio] Uploading cleaned audio to Cloudinary folder: ${targetFolder}`);
    const uploadResult = await uploadProcessedAudio(processedFilePath, targetFolder);

    // 5. Respond with cleaned URL
    res.status(200).json({
      audioUrl: uploadResult.secure_url,
      processingVersion: 'afftdn-v1',
      duration: uploadResult.duration || durationSeconds,
      requestId,
    });
  } catch (error: any) {
    console.error(`[ProcessAudio] Error processing audio for request ${requestId}:`, error.message || error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Audio processing failed',
      requestId,
    });
  } finally {
    // 6. Guarantee temporary files cleanup
    cleanupFiles(rawFilePath, processedFilePath);
  }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

const PORT = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Voice Denoise Backend running on port ${PORT}`);
  });

  const handleShutdown = () => {
    console.log('[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}
