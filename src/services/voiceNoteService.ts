import { uploadFileToCloudinary } from './fileToBytes';

function normalizeUri(uri: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) return uri;
  return `file://${uri}`;
}

/**
 * Ensure clean standard .m4a format for native expo-audio playback.
 */
export function applyCloudinaryAudioTransformations(
  url: string,
  transformations: string = ''
): string {
  if (!url) return url;
  // If it's an older Cloudinary video upload, normalize to .m4a and strip volume boosts
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    let cleanUrl = url.replace(/\.[a-zA-Z0-9]+$/, '.m4a');
    cleanUrl = cleanUrl.replace(/e_volume:[^/]+\//g, '');
    if (!transformations) {
      return cleanUrl;
    }
    if (cleanUrl.includes(`/video/upload/${transformations}/`)) {
      return cleanUrl;
    }
    return cleanUrl.replace('/video/upload/', `/video/upload/${transformations}/`);
  }
  return url;
}

/**
 * Upload voice note directly to Cloudinary as raw storage and return clean .m4a URL.
 * Uploading as 'raw' preserves the exact 44.1 kHz AAC audio byte-for-byte without
 * any server-side AMR-NB transcoding or bitrate degradation.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string,
  _durationSeconds?: number
): Promise<string> {
  const normalized = normalizeUri(localUri);
  console.log('[voiceNoteService] Uploading voice note to Cloudinary as raw...');
  const url = await uploadFileToCloudinary(normalized, 'raw', folder);
  console.log('[voiceNoteService] Voice note uploaded successfully:', url);
  return url;
}
