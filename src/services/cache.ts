import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_PREFIX = '@datty_cache:';

export const CacheKeys = {
  couple: (uid: string) => `couple_${uid}`,
  partnerProfile: (partnerUid: string) => `partner_profile_${partnerUid}`,
  notes: (coupleId: string) => `notes_${coupleId}`,
  partnerNotes: (uid: string) => `partner_notes_${uid}`,
  moments: (coupleId: string) => `moments_${coupleId}`,
  events: (coupleId: string) => `events_${coupleId}`,
  chat: (coupleId: string) => `chat_${coupleId}`,
  deck: (coupleId: string, deckId: string) => `deck_${coupleId}_${deckId}`,
  notifications: (uid: string) => `notifications_${uid}`,
};

export const cache = {
  /**
   * Synchronous 0ms retrieval from in-memory cache.
   * Perfect for useState initializers to prevent blank/spinner frames.
   */
  getMemory<T>(key: string): T | null {
    const entry = MEMORY_CACHE.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      MEMORY_CACHE.delete(key);
      return null;
    }
    return entry.data as T;
  },

  /**
   * Fast asynchronous retrieval: checks memory first, then AsyncStorage.
   */
  async get<T>(key: string): Promise<T | null> {
    const memVal = cache.getMemory<T>(key);
    if (memVal !== null) return memVal;

    try {
      const storageKey = CACHE_PREFIX + key;
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        AsyncStorage.removeItem(storageKey).catch(() => {});
        return null;
      }

      // Re-populate in-memory cache for subsequent instant synchronous reads
      MEMORY_CACHE.set(key, entry);
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Store data in memory immediately and persist to AsyncStorage asynchronously.
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    };

    MEMORY_CACHE.set(key, entry);

    try {
      const storageKey = CACHE_PREFIX + key;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (err) {
      // Non-fatal, memory cache remains active
    }
  },

  /**
   * Remove a single item from both memory and persistent storage.
   */
  async remove(key: string): Promise<void> {
    MEMORY_CACHE.delete(key);
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch {}
  },

  /**
   * Clear all items or items matching a specific prefix (e.g. for user sign-out).
   */
  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      MEMORY_CACHE.clear();
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
      } catch {}
      return;
    }

    // Prefix-based clear
    for (const k of Array.from(MEMORY_CACHE.keys())) {
      if (k.startsWith(prefix)) {
        MEMORY_CACHE.delete(k);
      }
    }

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const targetKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX + prefix));
      if (targetKeys.length > 0) {
        await AsyncStorage.multiRemove(targetKeys);
      }
    } catch {}
  },

  /**
   * Clear in-memory cache only (useful for testing or memory pressure).
   */
  clearMemory(): void {
    MEMORY_CACHE.clear();
  },
};
