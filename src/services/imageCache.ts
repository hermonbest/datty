import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const MEMORY_IMAGE_MAP = new Map<string, string>();
let cacheDirEnsured = false;

// Simple deterministic hash function (DJB2) for zero-dependency cache filenames
export function hashUri(uri: string): string {
  let hash = 5381;
  for (let i = 0; i < uri.length; i++) {
    hash = ((hash << 5) + hash) ^ uri.charCodeAt(i);
  }
  const ext = uri.includes('.png') ? '.png' : uri.includes('.webp') ? '.webp' : '.jpg';
  return `${Math.abs(hash).toString(36)}${ext}`;
}

function getCacheDir(): string | null {
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return null;
  return `${FileSystem.cacheDirectory}img_cache/`;
}

async function ensureCacheDir(): Promise<string | null> {
  const dir = getCacheDir();
  if (!dir) return null;
  if (cacheDirEnsured) return dir;

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    cacheDirEnsured = true;
    return dir;
  } catch (err) {
    return null;
  }
}

/**
 * Returns a local cached file path for a remote image URI.
 * Downloads and caches to disk if not already cached.
 */
export async function getCachedImageUri(remoteUri: string): Promise<string> {
  if (!remoteUri || !remoteUri.startsWith('http')) {
    return remoteUri;
  }

  // 1. Fast memory check
  if (MEMORY_IMAGE_MAP.has(remoteUri)) {
    return MEMORY_IMAGE_MAP.get(remoteUri)!;
  }

  const dir = await ensureCacheDir();
  if (!dir) return remoteUri;

  const filename = hashUri(remoteUri);
  const localFilePath = `${dir}${filename}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(localFilePath);
    if (fileInfo.exists) {
      MEMORY_IMAGE_MAP.set(remoteUri, localFilePath);
      return localFilePath;
    }

    // Download to disk in background
    const downloadRes = await FileSystem.downloadAsync(remoteUri, localFilePath);
    if (downloadRes && downloadRes.status >= 200 && downloadRes.status < 300) {
      MEMORY_IMAGE_MAP.set(remoteUri, downloadRes.uri);
      return downloadRes.uri;
    }
  } catch (err) {
    // Non-fatal, fallback to remote URI
  }

  return remoteUri;
}

/**
 * React hook to get a cached image URI.
 * Instantly returns local path if memory-cached, or original URI while fetching in background.
 */
export function useCachedImageUri(remoteUri?: string | null): string | null {
  const [uri, setUri] = useState<string | null>(() => {
    if (!remoteUri) return null;
    return MEMORY_IMAGE_MAP.get(remoteUri) || remoteUri;
  });

  useEffect(() => {
    if (!remoteUri) {
      setUri(null);
      return;
    }

    // If already mapped in memory, no need to re-query
    const mem = MEMORY_IMAGE_MAP.get(remoteUri);
    if (mem) {
      setUri(mem);
      return;
    }

    let isMounted = true;
    getCachedImageUri(remoteUri).then((local) => {
      if (isMounted) {
        setUri(local);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [remoteUri]);

  return uri;
}
