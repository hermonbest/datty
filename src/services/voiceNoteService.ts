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
  if (!url || !url.includes('cloudinary.com') || !url.includes('/video/upload/')) {
    return url;
  }
  // Replace extension with .m4a so expo-audio decodes native AAC / MP4 audio stream
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

/**
 * Upload voice note directly to Cloudinary and return clean .m4a URL.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string,
  _durationSeconds?: number
): Promise<string> {
  const normalized = normalizeUri(localUri);
  try {
    console.log('[voiceNoteService] Uploading voice note to Cloudinary...');
    const rawUrl = await uploadFileToCloudinary(normalized, 'video', folder);
    const cleanUrl = applyCloudinaryAudioTransformations(rawUrl);
    console.log('[voiceNoteService] Voice note uploaded successfully:', cleanUrl);
    return cleanUrl;
  } catch (err: any) {
    console.warn('[voiceNoteService] Video upload failed, falling back to raw upload:', err?.message || err);
    return uploadFileToCloudinary(normalized, 'raw', folder);
  }
}
