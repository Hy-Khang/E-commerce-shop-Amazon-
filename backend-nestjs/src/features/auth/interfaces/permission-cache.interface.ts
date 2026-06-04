export interface IPermissionCacheProvider {
  get(roleId: number): Promise<Set<string> | null>;
  set(roleId: number, permissions: Set<string>): Promise<void>;
  invalidate(roleId: number): Promise<void>;
  invalidateAll(): Promise<void>;
}

export const PERMISSION_CACHE_PROVIDER = 'PERMISSION_CACHE_PROVIDER';
