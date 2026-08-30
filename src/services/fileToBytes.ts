import * as FileSystem from 'expo-file-system';

// ---------------------------------------------------------------------------
// URI normalisation — some providers (expo-audio on Android) return raw paths
// without a scheme; expo-file-system requires file://.
// ---------------------------------------------------------------------------
function normalizeUri(uri: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) return uri;
  return `file://${uri}`;
}

// ---------------------------------------------------------------------------
// uploadFileToCloudinary
// ---------------------------------------------------------------------------
// Uploads a local file to Cloudinary via an unsigned upload preset.
// Uses expo-file-system uploadAsync (native multipart) — no Blob, no
// ArrayBuffer, no Firebase Storage. Works on Hermes/Android without any
// extra native modules.
//
// Required env vars:
//   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME    e.g. "dxyz1234"
//   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET e.g. "datty_chat"  (unsigned)
//
// Returns the permanent secure_url for the uploaded file.
// ---------------------------------------------------------------------------
export async function uploadFileToCloudinary(
  localUri: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw',
  folder?: string
): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Missing Cloudinary config. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  const normalized = normalizeUri(localUri);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const parameters: Record<string, string> = {
    upload_preset: uploadPreset,
  };
  if (folder) {
    parameters.folder = folder;
  }

  console.log('[cloudinary] uploading', resourceType, normalized, '->', uploadUrl);

  const result = await FileSystem.uploadAsync(uploadUrl, normalized, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    parameters,
  });

  if (result.status < 200 || result.status >= 300) {
    console.error('[cloudinary] upload failed', result.status, result.body);
    throw new Error(`Cloudinary upload failed with HTTP ${result.status}`);
  }

  let body: any;
  try {
    body = JSON.parse(result.body);
  } catch {
    throw new Error('Cloudinary: unexpected non-JSON response');
  }

  if (!body?.secure_url) {
    console.error('[cloudinary] no secure_url in response', body);
    throw new Error('Cloudinary: no secure_url in response');
  }

  console.log('[cloudinary] uploaded OK ->', body.secure_url);
  return body.secure_url as string;
}

// ---------------------------------------------------------------------------
// readFileAsUint8Array — kept for any remaining callers that need raw bytes
// ---------------------------------------------------------------------------
export async function readFileAsUint8Array(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(normalizeUri(uri), {
    encoding: FileSystem.EncodingType.Base64,
  });
  const atobFn = (globalThis as any).atob as (s: string) => string;
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// getFileSizeBytes — returns file size or null if unavailable
// ---------------------------------------------------------------------------
export async function getFileSizeBytes(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(normalizeUri(uri));
    return info.exists && typeof info.size === 'number' ? info.size : null;
  } catch {
    return null;
  }
}