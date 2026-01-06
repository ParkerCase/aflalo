// Simple in-memory cache for performance optimization
// In production, consider using Redis for distributed caching

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Maximum number of entries
  
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Clean expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    }
    
    this.cache.set(key, entry)
    console.log(`[CACHE] Set key: ${key}, TTL: ${ttlMs}ms`)
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      console.log(`[CACHE] Miss: ${key}`)
      return null
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      console.log(`[CACHE] Expired: ${key}`)
      return null
    }
    
    console.log(`[CACHE] Hit: ${key}`)
    return entry.data as T
  }
  
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      console.log(`[CACHE] Deleted: ${key}`)
    }
    return deleted
  }
  
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`[CACHE] Cleared ${size} entries`)
  }
  
  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    console.log(`[CACHE] Cleanup: removed ${cleaned} expired entries`)
  }
  
  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      active: this.cache.size - expired
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache()

// Cache utility functions for common patterns
export const withCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttlMs: number = 5 * 60 * 1000
) => {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)
    
    // Try to get from cache first
    const cached = cache.get<R>(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    try {
      const result = await fn(...args)
      cache.set(key, result, ttlMs)
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }
}

// Pre-defined cache keys for common operations
export const CacheKeys = {
  strainDatabase: () => 'strains:all',
  userByPin: (pin: string) => `user:${pin}`,
  userSession: (userId: string) => `session:${userId}:latest`,
  washingtonProducts: () => 'products:washington',
  adminDashboard: (range: string) => `admin:dashboard:${range}`,
  strainRecommendations: (profile: string) => `recommendations:${profile}`,
  feedbackStats: (range: string) => `feedback:stats:${range}`
}

// Cached wrapper for Database operations
export const CachedDatabase = {
  getUserByPin: withCache(
    async (pin: string) => {
      const { Database } = await import('./database')
      return Database.getUserByPin(pin)
    },
    CacheKeys.userByPin,
    2 * 60 * 1000 // 2 minutes
  ),
  
  getLatestSession: withCache(
    async (userId: string) => {
      const { Database } = await import('./database')
      return Database.getLatestSession(userId)
    },
    CacheKeys.userSession,
    1 * 60 * 1000 // 1 minute
  ),
  
  searchStrains: withCache(
    async (criteria: any) => {
      const { Database } = await import('./database')
      return Database.searchStrains(criteria)
    },
    (criteria) => `strains:search:${JSON.stringify(criteria)}`,
    10 * 60 * 1000 // 10 minutes
  )
}