import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Global storage module — provides the shared Supabase StorageService to any
 * feature (upload, product) without per-feature wiring, mirroring how the
 * database/mail core modules are bootstrapped once.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
