import { Logger } from './logger';

interface CacheEntry {
    value: any;
    timestamp: number;
    diffHash: string;
}

/**
 * Simple in-memory cache for AI responses.
 * Caches responses keyed by a hash of the diff content.
 */
export class ResponseCache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly ttlMs: number;
    private readonly maxEntries: number;

    constructor(ttlMs: number = 5 * 60 * 1000, maxEntries: number = 50) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
    }

    /**
     * Get cached response for a given diff hash.
     */
    get(diffHash: string): any | null {
        const entry = this.cache.get(diffHash);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(diffHash);
            return null;
        }

        Logger.debug('ResponseCache: Cache hit', { diffHash });
        return entry.value;
    }

    /**
     * Cache a response for a given diff hash.
     */
    set(diffHash: string, value: any): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxEntries) {
            const oldest = this.cache.keys().next().value;
            if (oldest) this.cache.delete(oldest);
        }

        this.cache.set(diffHash, {
            value,
            timestamp: Date.now(),
            diffHash,
        });

        Logger.debug('ResponseCache: Cached response', { diffHash, cacheSize: this.cache.size });
    }

    /**
     * Create a simple hash from diff content.
     */
    static hashDiff(diffContent: string): string {
        let hash = 0;
        for (let i = 0; i < diffContent.length; i++) {
            const char = diffContent.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Clear the entire cache.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache size.
     */
    get size(): number {
        return this.cache.size;
    }
}
