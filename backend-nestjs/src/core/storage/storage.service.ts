import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Thin wrapper over Supabase Storage (object storage), replacing the old local
 * disk + Express static serving. Uploads return an **absolute public URL**
 * (bucket is public-read); deletes parse the object path back out of that URL.
 *
 * The service-role key is used server-side only (bypasses RLS). If Supabase is
 * not configured, the service logs and no-ops gracefully so the app still boots.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket: string;
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('storage.supabaseUrl', '');
    this.serviceRoleKey = this.configService.get<string>(
      'storage.serviceRoleKey',
      '',
    );
    this.bucket = this.configService.get<string>(
      'storage.bucket',
      'product-images',
    );
  }

  onModuleInit(): void {
    if (this.supabaseUrl && this.serviceRoleKey) {
      this.client = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.logger.warn(
        'Supabase Storage not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing) — uploads/deletes will fail.',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getBucket(): string {
    return this.bucket;
  }

  /**
   * Upload a buffer to `path` inside the bucket and return its absolute public URL.
   * @param path e.g. `products/<uuid>.jpg`
   */
  async upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Supabase Storage is not configured');
    }
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, { contentType, upsert: false });
    if (error) {
      this.logger.error(`Upload failed for ${path}: ${error.message}`);
      throw error;
    }
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Given a public URL, return the object path inside our bucket, or null if the
   * URL does not point at this Supabase bucket (external/legacy URL → skip).
   * Public URLs look like `<base>/storage/v1/object/public/<bucket>/<path>`.
   */
  parsePathFromPublicUrl(url: string): string | null {
    const marker = `/object/public/${this.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  }

  /** Best-effort delete; logs and swallows failures (mirrors old unlink behavior). */
  async remove(path: string): Promise<void> {
    if (!this.client) return;
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);
    if (error) {
      this.logger.warn(`Could not delete object ${path}: ${error.message}`);
    } else {
      this.logger.log(`Object deleted: ${path}`);
    }
  }
}
