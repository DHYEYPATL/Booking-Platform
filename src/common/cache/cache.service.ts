import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<any>>();
  private readonly logger = new Logger('CacheService');

  /**
   * Sets a value in the cache with a specified Time To Live (TTL) in milliseconds.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
    this.logger.debug(`Cache set: "${key}" (TTL: ${ttlMs}ms)`);
  }

  /**
   * Retrieves a value from the cache. Returns null if expired or missing.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.debug(`Cache expired and evicted: "${key}"`);
      return null;
    }

    this.logger.debug(`Cache hit: "${key}"`);
    return entry.value as T;
  }

  /**
   * Evicts a single key from cache.
   */
  delete(key: string): void {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.logger.debug(`Cache evicted manually: "${key}"`);
    }
  }

  /**
   * Resets all keys in the cache.
   */
  clear(): void {
    this.store.clear();
    this.logger.debug('Cache cleared completely');
  }
}
