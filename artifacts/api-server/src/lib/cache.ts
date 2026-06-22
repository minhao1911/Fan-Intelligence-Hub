/**
 * In-process LRU cache with per-entry TTL.
 *
 * Drop-in compatible with a Redis cache-aside pattern:
 * the same withCache() helper works whether the backing store
 * is this LRU map or a Redis client — just swap the get/set calls.
 *
 * Default TTLs (can be overridden per-call):
 *   LEADERBOARD  30 s  — changes on every vote/reaction/discussion
 *   NATION       30 s  — changes on join/leave/confidence updates
 *   PULSE        60 s  — heavy aggregate, changes slowly
 *   STATS        60 s  — global aggregate
 *   CONFIDENCE   15 s  — voted on frequently
 */

import { LRUCache } from "lru-cache";

export const TTL = {
  LEADERBOARD:  30_000,
  NATION:       30_000,
  PULSE:        60_000,
  STATS:        60_000,
  CONFIDENCE:   15_000,
} as const;

const cache = new LRUCache<string, unknown>({
  max: 500,            // max 500 distinct keys in memory
  ttl: 30_000,         // default TTL; overridden per-entry via set()
  allowStale: false,   // never serve expired entries
});

/** Read a typed entry. Returns undefined on miss or expiry. */
export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** Write a typed entry with an optional TTL (ms). */
export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  cache.set(key, value, ttl !== undefined ? { ttl } : undefined);
}

/** Delete a single key. */
export function cacheDel(key: string): void {
  cache.delete(key);
}

/** Delete all keys that start with a given prefix. */
export function cacheDelPrefix(prefix: string): void {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

/**
 * Cache-aside helper.
 * On hit: returns the cached value immediately.
 * On miss: calls fn(), stores the result, returns it.
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cacheSet(key, value, ttl);
  return value;
}
