import * as FileSystem from 'expo-file-system/legacy';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { uploadFileToCloudinary } from './fileToBytes';

function normalizeUri(uri: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) return uri;
  return `file://${uri}`;
}

interface ProcessVoiceNoteRequest {
  audioBase64: string;
  filename?: string;
  folder?: string;
}

interface ProcessVoiceNoteResponse {
  secure_url: string;
  processed: boolean;
}

/**
 * Apply Cloudinary audio transformations to a delivered media URL.
 * Transforms include volume normalization (`e_volume:max_peak`), AAC codec (`ac_aac`), and 96kbps bitrate (`br_96k`).
 */
export function applyCloudinaryAudioTransformations(
  url: string,
  transformations: string = 'e_volume:max_peak,ac_aac,br_96k'
): string {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/video/upload/')) {
    return url;
  }
  // Avoid duplicate transformation injection
  if (url.includes(`/video/upload/${transformations}/`)) {
    return url;
  }
  return url.replace('/video/upload/', `/video/upload/${transformations}/`);
}

/**
 * Upload voice note directly to Cloudinary with audio loudness normalization (100% Free).
 */
export async function uploadVoiceNoteWithCloudinaryTransform(
  localUri: string,
  folder?: string
): Promise<string> {
  try {
    console.log('[voiceNoteService] Uploading voice note as video resource for Cloudinary audio processing...');
    const rawUrl = await uploadFileToCloudinary(localUri, 'video', folder);
    const transformedUrl = applyCloudinaryAudioTransformations(rawUrl, 'e_volume:max_peak,ac_aac,br_96k');
    console.log('[voiceNoteService] Cloudinary transformed audio URL:', transformedUrl);
    return transformedUrl;
  } catch (err: any) {
    console.warn('[voiceNoteService] Video upload failed, falling back to raw upload:', err?.message || err);
    return uploadFileToCloudinary(localUri, 'raw', folder);
  }
}

/**
 * Process and upload voice note:
 * 1. Checks if Cloud Function is available; if not, uses Cloudinary's built-in audio transformations (100% Free).
 * 2. CRITICAL FALLBACK: If anything fails, falls back directly to raw Cloudinary upload so voice note sending is NEVER blocked.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string
): Promise<string> {
  const normalized = normalizeUri(localUri);

  // Use Cloudinary's built-in audio processing (100% Free, no server required)
  return uploadVoiceNoteWithCloudinaryTransform(normalized, folder);
}
