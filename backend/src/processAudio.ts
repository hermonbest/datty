import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';

// Locate ffmpeg binary (prefer FFMPEG_PATH env, then ffmpeg-static)
try {
  if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
    }
  }
} catch (e: any) {
  console.warn('[processAudio] Warning setting ffmpeg path:', e.message);
}

export interface AudioProcessingOptions {
  highpassFrequency?: number;
  lowpassFrequency?: number;
  noiseReductionDb?: number;
  noiseFloorDb?: number;
  volumeBoostDb?: number;
  sampleRate?: number;
  bitrate?: string;
}

export const DEFAULT_PROCESSING_OPTIONS: AudioProcessingOptions = {
  highpassFrequency: 90,
  lowpassFrequency: 7500,
  noiseReductionDb: 22,
  noiseFloorDb: -35,
  volumeBoostDb: 1.5,
  sampleRate: 44100,
  bitrate: '96k',
};

/**
 * Runs the FFmpeg filter chain for broadband hiss reduction and natural volume preservation.
 */
export function runFFmpegDenoise(
  inputPath: string,
  outputPath: string,
  options?: AudioProcessingOptions
): Promise<void> {
  const envNr = process.env.NOISE_REDUCTION_DB ? Number(process.env.NOISE_REDUCTION_DB) : undefined;
  const envNf = process.env.NOISE_FLOOR_DB ? Number(process.env.NOISE_FLOOR_DB) : undefined;
  const envBoost = process.env.VOLUME_BOOST_DB ? Number(process.env.VOLUME_BOOST_DB) : undefined;

  const opts = {
    ...DEFAULT_PROCESSING_OPTIONS,
    ...(envNr ? { noiseReductionDb: envNr } : {}),
    ...(envNf ? { noiseFloorDb: envNf } : {}),
    ...(envBoost !== undefined ? { volumeBoostDb: envBoost } : {}),
    ...options,
  };

  // Construct audio filter chain:
  // 1. Highpass (90Hz): Strip low-end handling noise & wind
  // 2. Lowpass (7.5kHz): Strip high-frequency hiss
  // 3. afftdn: Pure spectral noise reduction without changing voice volume
  // 4. volume: Tiny subtle boost (e.g. +1.5dB) preserving natural speaker dynamics
  // 5. agate: Soft downward gate to keep pauses clean
  // 6. alimiter: Protect against any peak clipping
  const filters: string[] = [
    `highpass=f=${opts.highpassFrequency}`,
    `lowpass=f=${opts.lowpassFrequency}`,
    `afftdn=nr=${opts.noiseReductionDb}:nf=${opts.noiseFloorDb}:tn=1`,
    `volume=${opts.volumeBoostDb || 1.5}dB`,
    `agate=range=-25dB:threshold=0.035:ratio=3:attack=15:release=220`,
    `alimiter=limit=0.95`,
  ];

  return new Promise((resolve, reject) => {
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    ffmpeg(inputPath)
      .audioFilters(filters)
      .audioCodec('aac')
      .audioChannels(1)
      .audioFrequency(opts.sampleRate || 44100)
      .audioBitrate(opts.bitrate || '128k')
      .format('ipod') // Standard MP4/M4A container for AAC audio
      .outputOptions(['-movflags', '+faststart'])
      .output(outputPath)
      .on('start', (cmdLine) => {
        console.log('[processAudio] FFmpeg started:', cmdLine);
      })
      .on('end', () => {
        console.log('[processAudio] FFmpeg processing complete:', outputPath);
        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error('[processAudio] FFmpeg error:', err.message);
        if (stderr) console.error('[processAudio] FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg processing failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Safely delete temporary files if they exist.
 */
export function cleanupFiles(...filePaths: (string | null | undefined)[]): void {
  for (const filePath of filePaths) {
    if (filePath && typeof filePath === 'string') {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[processAudio] Cleaned up temporary file:', filePath);
        }
      } catch (e: any) {
        console.warn('[processAudio] Error cleaning up file:', filePath, e.message);
      }
    }
  }
}
