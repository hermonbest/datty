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
 * Process and upload voice note:
 * 1. Reads local audio file as base64 string.
 * 2. Invokes Firebase Cloud Function `processVoiceNote` for noise reduction, rumble filter, and -16 LUFS loudness normalization.
 * 3. CRITICAL FALLBACK: If Cloud Function fails (network error, timeout, backend exception), falls back immediately
 *    to direct raw Cloudinary upload so voice note sending is NEVER blocked.
 */
export async function processAndUploadVoiceNote(
  localUri: string,
  folder?: string
): Promise<string> {
  const normalized = normalizeUri(localUri);

  try {
    console.log('[voiceNoteService] Reading audio file for post-processing:', normalized);
    const audioBase64 = await FileSystem.readAsStringAsync(normalized, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!audioBase64) {
      throw new Error('Empty audio payload');
    }

    console.log('[voiceNoteService] Invoking processVoiceNote Cloud Function...');
    const processVoiceNoteCallable = httpsCallable<ProcessVoiceNoteRequest, ProcessVoiceNoteResponse>(
      functions,
      'processVoiceNote'
    );

    const result = await processVoiceNoteCallable({
      audioBase64,
      folder,
    });

    const secureUrl = result?.data?.secure_url;
    if (!secureUrl) {
      throw new Error('Cloud function returned empty secure_url');
    }

    console.log(
      '[voiceNoteService] Successfully processed voice note (processed =',
      result.data.processed,
      ')->',
      secureUrl
    );
    return secureUrl;
  } catch (err: any) {
    console.warn(
      '[voiceNoteService] Cloud Function processVoiceNote failed, falling back to direct Cloudinary upload:',
      err?.message || err
    );

    // Fallback directly to existing raw Cloudinary upload
    return uploadFileToCloudinary(localUri, 'raw', folder);
  }
}
