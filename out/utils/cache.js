"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCache = void 0;
const logger_1 = require("./logger");
/**
 * Simple in-memory cache for AI responses.
 * Caches responses keyed by a hash of the diff content.
 */
class ResponseCache {
    constructor(ttlMs = 5 * 60 * 1000, maxEntries = 50) {
        this.cache = new Map();
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
    }
    /**
     * Get cached response for a given diff hash.
     */
    get(diffHash) {
        const entry = this.cache.get(diffHash);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(diffHash);
            return null;
        }
        logger_1.Logger.debug('ResponseCache: Cache hit', { diffHash });
        return entry.value;
    }
    /**
     * Cache a response for a given diff hash.
     */
    set(diffHash, value) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxEntries) {
            const oldest = this.cache.keys().next().value;
            if (oldest)
                this.cache.delete(oldest);
        }
        this.cache.set(diffHash, {
            value,
            timestamp: Date.now(),
            diffHash,
        });
        logger_1.Logger.debug('ResponseCache: Cached response', { diffHash, cacheSize: this.cache.size });
    }
    /**
     * Create a simple hash from diff content.
     */
    static hashDiff(diffContent) {
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
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size.
     */
    get size() {
        return this.cache.size;
    }
}
exports.ResponseCache = ResponseCache;
//# sourceMappingURL=cache.js.map