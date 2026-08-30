import * as FileSystem from 'expo-file-system';

// Reads a local file (file:// or content://) as bytes via expo-file-system.
// This is the safe alternative to fetch(uri).blob(), which on Android:
//  - crashes (app restart) on large gallery images due to memory
//  - fails on content:// URIs returned by the system photo picker
export async function readFileAsUint8Array(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
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

// Returns the file size in bytes, or null if it can't be determined.
export async function getFileSizeBytes(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && typeof info.size === 'number' ? info.size : null;
  } catch {
    return null;
  }
}