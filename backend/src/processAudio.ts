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
  highpassFrequency: 80,
  lowpassFrequency: 7500,
  noiseReductionDb: 20,
  noiseFloorDb: -40,
  loudnessTarget: -16,
  sampleRate: 44100,
  bitrate: '128k',
};

/**
 * Runs the FFmpeg filter chain for broadband hiss reduction and loudness normalization.
 */
export function runFFmpegDenoise(
  inputPath: string,
  outputPath: string,
  options: AudioProcessingOptions = DEFAULT_PROCESSING_OPTIONS
): Promise<void> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };

  // Construct audio filter chain
  const filters: string[] = [
    `highpass=f=${opts.highpassFrequency}`,
    `lowpass=f=${opts.lowpassFrequency}`,
    `afftdn=nr=${opts.noiseReductionDb}:nf=${opts.noiseFloorDb}:tn=1`,
    `loudnorm=I=${opts.loudnessTarget}:TP=-1.5:LRA=11`,
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
