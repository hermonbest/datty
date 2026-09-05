jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
}));

let mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStorage[key] || null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockStorage[key];
  }),
  getAllKeys: jest.fn(async () => Object.keys(mockStorage)),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((k) => delete mockStorage[k]);
  }),
  clear: jest.fn(async () => {
    mockStorage = {};
  }),
}));

import { cache, CacheKeys } from '../src/services/cache';
import { hashUri, getCachedImageUri } from '../src/services/imageCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Systematic Cache Service', () => {
  beforeEach(async () => {
    await cache.clear();
    jest.clearAllMocks();
  });

  describe('In-Memory Cache (Tier 1)', () => {
    it('returns null for an unset key', () => {
      expect(cache.getMemory('non_existent')).toBeNull();
    });

    it('stores and retrieves data synchronously in memory', async () => {
      await cache.set('user_123', { name: 'Alice', age: 25 });
      const mem = cache.getMemory<{ name: string; age: number }>('user_123');
      expect(mem).toEqual({ name: 'Alice', age: 25 });
    });

    it('handles TTL expiration in memory', async () => {
      jest.useFakeTimers();
      try {
        await cache.set('temp_key', 'temp_value', 1000); // 1 sec TTL
        expect(cache.getMemory('temp_key')).toBe('temp_value');

        jest.advanceTimersByTime(1500);
        expect(cache.getMemory('temp_key')).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('Persistent Cache Fallback (Tier 2)', () => {
    it('falls back to AsyncStorage when memory cache is empty', async () => {
      await cache.set('persisted_key', { score: 100 });

      // Simulate memory wipe (e.g. app restart)
      cache.clearMemory();

      const retrieved = await cache.get<{ score: number }>('persisted_key');
      expect(retrieved).toEqual({ score: 100 });

      // It should now also be restored in memory for synchronous reads
      expect(cache.getMemory('persisted_key')).toEqual({ score: 100 });
    });

    it('handles corrupt JSON in AsyncStorage gracefully without throwing', async () => {
      const storageKey = '@datty_cache:corrupt_key';
      await AsyncStorage.setItem(storageKey, '{invalid-json-data');

      const val = await cache.get('corrupt_key');
      expect(val).toBeNull();
    });

    it('ignores expired data from AsyncStorage', async () => {
      const storageKey = '@datty_cache:expired_storage';
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          data: 'ancient',
          timestamp: Date.now() - 10000,
          expiresAt: Date.now() - 5000,
        })
      );

      const val = await cache.get('expired_storage');
      expect(val).toBeNull();
    });
  });

  describe('Removal and Prefix Clearing', () => {
    it('removes a single key from memory and storage', async () => {
      await cache.set('to_remove', 'test');
      expect(cache.getMemory('to_remove')).toBe('test');

      await cache.remove('to_remove');
      expect(cache.getMemory('to_remove')).toBeNull();
      expect(await cache.get('to_remove')).toBeNull();
    });

    it('clears specific prefixes while keeping other data intact', async () => {
      await cache.set('couple_123_notes', ['note1']);
      await cache.set('couple_123_moments', ['moment1']);
      await cache.set('other_data', 'preserved');

      await cache.clear('couple_123');

      expect(cache.getMemory('couple_123_notes')).toBeNull();
      expect(cache.getMemory('couple_123_moments')).toBeNull();
      expect(cache.getMemory('other_data')).toBe('preserved');
    });

    it('clears all cache on sign-out', async () => {
      await cache.set('k1', 'v1');
      await cache.set('k2', 'v2');

      await cache.clear();

      expect(cache.getMemory('k1')).toBeNull();
      expect(cache.getMemory('k2')).toBeNull();
    });
  });

  describe('CacheKey Helpers', () => {
    it('formats standardized keys correctly', () => {
      expect(CacheKeys.couple('u1')).toBe('couple_u1');
      expect(CacheKeys.notes('c1')).toBe('notes_c1');
      expect(CacheKeys.moments('c1')).toBe('moments_c1');
      expect(CacheKeys.events('c1')).toBe('events_c1');
      expect(CacheKeys.chat('c1')).toBe('chat_c1');
      expect(CacheKeys.deck('c1', 'deck_a')).toBe('deck_c1_deck_a');
      expect(CacheKeys.notifications('u1')).toBe('notifications_u1');
    });
  });

  describe('Image URI Hashing', () => {
    it('produces deterministic filenames preserving extensions', () => {
      const url1 = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';
      const url2 = 'https://res.cloudinary.com/demo/image/upload/v1/sample.png';
      const url3 = 'https://res.cloudinary.com/demo/image/upload/v1/sample.webp';

      const hash1a = hashUri(url1);
      const hash1b = hashUri(url1);
      expect(hash1a).toBe(hash1b);
      expect(hash1a.endsWith('.jpg')).toBe(true);
      expect(hashUri(url2).endsWith('.png')).toBe(true);
      expect(hashUri(url3).endsWith('.webp')).toBe(true);
    });
  });
});
