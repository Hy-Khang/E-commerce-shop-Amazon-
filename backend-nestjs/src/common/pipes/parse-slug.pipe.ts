import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseSlugPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      throw new BadRequestException(`Invalid slug format: "${value}"`);
    }
    return value;
  }
}
