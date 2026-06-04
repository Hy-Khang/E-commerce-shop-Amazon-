import { Injectable } from '@nestjs/common';
import { IPermissionCacheProvider } from '../interfaces/permission-cache.interface';

interface CacheEntry {
  permissions: Set<string>;
  cachedAt: number;
}

const DEFAULT_TTL_MS = 60_000;

@Injectable()
export class InMemoryPermissionCache implements IPermissionCacheProvider {
  private readonly cache = new Map<number, CacheEntry>();
  private readonly ttlMs: number;

  constructor() {
    this.ttlMs = DEFAULT_TTL_MS;
  }

  async get(roleId: number): Promise<Set<string> | null> {
    const entry = this.cache.get(roleId);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(roleId);
      return null;
    }

    return entry.permissions;
  }

  async set(roleId: number, permissions: Set<string>): Promise<void> {
    this.cache.set(roleId, { permissions, cachedAt: Date.now() });
  }

  async invalidate(roleId: number): Promise<void> {
    this.cache.delete(roleId);
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear();
  }
}
