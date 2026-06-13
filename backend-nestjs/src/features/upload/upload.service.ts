import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('app.uploadDir')!;
    this.appUrl = this.configService.get<string>('app.appUrl', '')!;
  }

  async saveImage(file: Express.Multer.File): Promise<string> {
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        `Unsupported image type: ${file.mimetype}`,
      );
    }

    const subDir = 'products';
    const dir = join(this.uploadDir, subDir);
    await mkdir(dir, { recursive: true });

    const filename = `${uuidv4()}${ext}`;
    const filePath = join(dir, filename);

    await writeFile(filePath, file.buffer);

    const relativePath = `/uploads/${subDir}/${filename}`;
    const url = this.appUrl ? `${this.appUrl}${relativePath}` : relativePath;
    this.logger.log(`Image uploaded: ${url}`);
    return url;
  }
}
