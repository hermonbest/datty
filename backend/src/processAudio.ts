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
  loudnessTarget?: number;
  sampleRate?: number;
  bitrate?: string;
}

export const DEFAULT_PROCESSING_OPTIONS: AudioProcessingOptions = {
  highpassFrequency: 100,
  lowpassFrequency: 7200,
  noiseReductionDb: 22,
  noiseFloorDb: -35,
  loudnessTarget: -16,
  sampleRate: 48000,
  bitrate: '96k',
};

/**
 * Runs the FFmpeg filter chain for broadband hiss reduction and loudness normalization.
 */
export function runFFmpegDenoise(
  inputPath: string,
  outputPath: string,
  options?: AudioProcessingOptions
): Promise<void> {
  const envNr = process.env.NOISE_REDUCTION_DB ? Number(process.env.NOISE_REDUCTION_DB) : undefined;
  const envNf = process.env.NOISE_FLOOR_DB ? Number(process.env.NOISE_FLOOR_DB) : undefined;

  const opts = {
    ...DEFAULT_PROCESSING_OPTIONS,
    ...(envNr ? { noiseReductionDb: envNr } : {}),
    ...(envNf ? { noiseFloorDb: envNf } : {}),
    ...options,
  };

  // Construct audio filter chain:
  // 1. Highpass (100Hz): Strip low-end mic rumble and wind
  // 2. Lowpass (7.2kHz): Strip high-frequency static/air hiss
  // 3. afftdn (22dB reduction, -35dB noise floor): Natural spectral subtraction without watery artifacts
  // 4. loudnorm (EBU R128): Normalize voice volume to -16 LUFS
  // 5. agate (Deep post-gain gate): Mute any noise lifted by loudnorm during pauses
  const filters: string[] = [
    `highpass=f=${opts.highpassFrequency}`,
    `lowpass=f=${opts.lowpassFrequency}`,
    `afftdn=nr=${opts.noiseReductionDb}:nf=${opts.noiseFloorDb}:tn=1`,
    `loudnorm=I=${opts.loudnessTarget}:TP=-1.5:LRA=9`,
    `agate=range=-38dB:threshold=0.035:ratio=6:attack=10:release=250`,
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
