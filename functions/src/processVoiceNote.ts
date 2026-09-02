import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Configure ffmpeg binary path from ffmpeg-static
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Configure Cloudinary from environment if available
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'qrzxe89y';
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'datty_chat';

if (apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: cloudName,
    secure: true,
  });
}

export interface ProcessVoiceNoteRequest {
  audioBase64: string;
  filename?: string;
  folder?: string;
}

export interface ProcessVoiceNoteResponse {
  secure_url: string;
  processed: boolean;
}

/**
 * Upload a local file to Cloudinary using either API credentials or unsigned preset
 */
async function uploadToCloudinary(filePath: string, folder?: string): Promise<UploadApiResponse> {
  const targetFolder = folder || 'datty/voice_notes';

  if (apiKey && apiSecret) {
    return cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: targetFolder,
    });
  }

  // Fallback to unsigned upload if API secret is not set in environment
  return cloudinary.uploader.unsigned_upload(filePath, uploadPreset, {
    resource_type: 'video',
    folder: targetFolder,
  });
}

/**
 * Run ffmpeg audio processing filter chain:
 * - highpass 80Hz: remove low-frequency mic rumble/wind
 * - lowpass 7500Hz: remove high-frequency hiss outside voice band
 * - afftdn: FFT-based noise reduction for noise floor / silence
 * - loudnorm: normalize loudness to mobile voice standard (-16 LUFS, -1.5dB TP)
 * - output: AAC mono, 96kbps, 48000Hz
 */
function transcodeAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegStatic) {
      return reject(new Error('ffmpeg-static binary path not found'));
    }

    ffmpeg(inputPath)
      .audioFilters([
        'highpass=f=80',
        'lowpass=f=7500',
        'afftdn=nr=25:nf=-45',
        'loudnorm=I=-16:TP=-1.5:LRA=11',
      ])
      .audioCodec('aac')
      .audioBitrate('96k')
      .audioChannels(1)
      .audioFrequency(48000)
      .output(outputPath)
      .on('end', () => {
        logger.info('[processVoiceNote] ffmpeg processing completed successfully');
        resolve();
      })
      .on('error', (err: Error) => {
        logger.warn('[processVoiceNote] ffmpeg processing error:', err.message);
        reject(err);
      })
      .run();
  });
}

export const processVoiceNote = onCall<ProcessVoiceNoteRequest, Promise<ProcessVoiceNoteResponse>>(
  {
    memory: '512MiB',
    timeoutSeconds: 60,
    region: 'europe-west1',
  },
  async (request) => {
    const { audioBase64, folder } = request.data;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      throw new HttpsError('invalid-argument', 'Missing or invalid audioBase64 payload');
    }

    const id = uuidv4();
    const tempDir = os.tmpdir();
    const rawInputPath = path.join(tempDir, `${id}.m4a`);
    const processedOutputPath = path.join(tempDir, `${id}_proc.m4a`);

    try {
      // 1. Write incoming base64 audio to /tmp
      const buffer = Buffer.from(audioBase64, 'base64');
      await fs.promises.writeFile(rawInputPath, buffer);
      logger.info(`[processVoiceNote] Wrote raw audio (${buffer.length} bytes) to ${rawInputPath}`);

      let uploadPath = processedOutputPath;
      let isProcessed = true;

      // 2. Transcode with ffmpeg
      try {
        await transcodeAudio(rawInputPath, processedOutputPath);
      } catch (ffmpegErr: any) {
        // Fallback to raw unprocessed audio on ffmpeg failure
        logger.warn(
          '[processVoiceNote] ffmpeg transcode failed; falling back to uploading raw audio:',
          ffmpegErr?.message || ffmpegErr
        );
        uploadPath = rawInputPath;
        isProcessed = false;
      }

      // 3. Upload to Cloudinary
      logger.info(`[processVoiceNote] Uploading ${isProcessed ? 'processed' : 'raw'} audio to Cloudinary...`);
      const uploadResult = await uploadToCloudinary(uploadPath, folder);

      if (!uploadResult.secure_url) {
        throw new HttpsError('internal', 'Cloudinary response did not contain secure_url');
      }

      logger.info(`[processVoiceNote] Upload complete -> ${uploadResult.secure_url}`);
      return {
        secure_url: uploadResult.secure_url,
        processed: isProcessed,
      };
    } catch (err: any) {
      logger.error('[processVoiceNote] Unhandled error during voice note processing:', err);
      if (err instanceof HttpsError) {
        throw err;
      }
      throw new HttpsError('internal', err?.message || 'Failed to process voice note');
    } finally {
      // 4. Best-effort cleanup of temp files
      await Promise.all([
        fs.promises.unlink(rawInputPath).catch(() => {}),
        fs.promises.unlink(processedOutputPath).catch(() => {}),
      ]);
    }
  }
);
