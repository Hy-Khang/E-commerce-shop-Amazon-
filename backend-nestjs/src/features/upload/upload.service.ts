import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../../core/storage/storage.service';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload an image to Supabase Storage and return its absolute public URL.
   * The file arrives in memory (`file.buffer`) via multer's default memory
   * storage — no disk write, no static serving.
   */
  async saveImage(file: Express.Multer.File): Promise<string> {
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
    }

    const path = `products/${uuidv4()}${ext}`;
    const url = await this.storageService.upload(
      path,
      file.buffer,
      file.mimetype,
    );
    this.logger.log(`Image uploaded: ${url}`);
    return url;
  }
}
