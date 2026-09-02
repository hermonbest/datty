import { uploadFileToCloudinary } from './fileToBytes';

function normalizeUri(uri: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) return uri;
  return `file://${uri}`;
}

/**
 * Apply Cloudinary audio transformations to a delivered media URL.
 * Normalizes volume with `e_volume:80` (+80% loudness boost) and ensures
 * standard `.m4a` audio format that expo-audio can natively play.
 */
export function applyCloudinaryAudioTransformations(
  url: string,
  transformations: string = 'e_volume:80'
): string {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/video/upload/')) {
    return url;
  }
  // Replace .3gp extension with .m4a so expo-audio gets native AAC / MP4 audio stream
  let cleanUrl = url.replace(/\.[a-zA-Z0-9]+$/, '.m4a');
  if (cleanUrl.includes(`/video/upload/${transformations}/`)) {
    return cleanUrl;
  }
  return cleanUrl.replace('/video/upload/', `/video/upload/${transformations}/`);
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
    const transformedUrl = applyCloudinaryAudioTransformations(rawUrl, 'e_volume:80');
    console.log('[voiceNoteService] Cloudinary transformed audio URL:', transformedUrl);
    return transformedUrl;
  } catch (err: any) {
    console.warn('[voiceNoteService] Video upload failed, falling back to raw upload:', err?.message || err);
    return uploadFileToCloudinary(localUri, 'raw', folder);
  }
}

/**
 * Process and upload voice note:
 * 1. Uses Cloudinary's built-in audio transformations (100% Free, no server required).
 * 2. CRITICAL FALLBACK: If anything fails, falls back directly to raw Cloudinary upload so voice note sending is NEVER blocked.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string
): Promise<string> {
  const normalized = normalizeUri(localUri);
  return uploadVoiceNoteWithCloudinaryTransform(normalized, folder);
}
