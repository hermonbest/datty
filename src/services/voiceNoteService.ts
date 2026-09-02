import Constants from 'expo-constants';
import { uploadFileToCloudinary } from './fileToBytes';
import { auth } from './firebase';

const DEFAULT_AUDIO_BACKEND_URL = 'https://datty.onrender.com';

function normalizeUri(uri: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) return uri;
  return `file://${uri}`;
}

/**
 * Apply Cloudinary audio transformations to a delivered media URL.
 * Applies a consistent volume level with `e_volume:80` and ensures
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

function getBackendUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_AUDIO_BACKEND_URL;
  const extra = Constants.expoConfig?.extra || (Constants as any).manifest?.extra || {};
  const extraUrl = extra.audioBackendUrl;

  const isValid = (u: any): u is string =>
    typeof u === 'string' &&
    u.startsWith('http') &&
    !u.includes('<') &&
    !u.includes('your-backend-url');

  if (isValid(envUrl)) return envUrl.replace(/\/+$/, '');
  if (isValid(extraUrl)) return extraUrl.replace(/\/+$/, '');
  return DEFAULT_AUDIO_BACKEND_URL;
}

/**
 * Call the remote FFmpeg audio processing microservice (e.g. deployed on OCI/Render).
 */
export async function requestServerDenoise(
  rawUrl: string,
  coupleId: string,
  durationSeconds?: number
): Promise<string> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error('Audio backend URL is not configured');
  }

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error('User is not authenticated with Firebase');
  }

  console.log(`[voiceNoteService] Sending audio to backend for FFmpeg denoising: ${backendUrl}/v1/audio/process`);
  const response = await fetch(`${backendUrl}/v1/audio/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      sourceUrl: rawUrl,
      coupleId,
      durationSeconds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Backend processing failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data?.audioUrl) {
    throw new Error('Backend response missing audioUrl');
  }

  console.log('[voiceNoteService] Backend denoised audio URL received:', data.audioUrl);
  return data.audioUrl;
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
 * 1. If EXPO_PUBLIC_AUDIO_BACKEND_URL is configured, uploads raw audio to Cloudinary,
 *    then triggers backend FFmpeg afftdn hiss-reduction.
 * 2. If backend is unconfigured or fails, falls back directly to Cloudinary audio transform.
 * 3. CRITICAL FALLBACK: If anything fails, falls back directly to raw Cloudinary upload so voice note sending is NEVER blocked.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string,
  durationSeconds?: number
): Promise<string> {
  const normalized = normalizeUri(localUri);
  const backendUrl = getBackendUrl();
  console.log('[voiceNoteService] Backend URL resolved:', backendUrl);

  if (backendUrl) {
    try {
      console.log('[voiceNoteService] Uploading source audio for backend processing...');
      const rawUrl = await uploadFileToCloudinary(normalized, 'video', folder);

      // Extract coupleId from folder pattern 'datty/<coupleId>/chat' or fallback
      const folderParts = folder ? folder.split('/') : [];
      const coupleId = folderParts[1] || 'default';

      return await requestServerDenoise(rawUrl, coupleId, durationSeconds);
    } catch (err: any) {
      console.warn('[voiceNoteService] Backend processing failed, falling back to Cloudinary transform:', err?.message || err);
    }
  }

  return uploadVoiceNoteWithCloudinaryTransform(normalized, folder);
}
