import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
  registerDecorator,
  validateSync,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Shop Decoration block schema (source of truth — mirrored on the FE in
 * `decoration.types.ts` / `DECORATION_LIMITS`). A versioned JSON envelope
 * validated with nested class-validator DTOs so a malformed config is rejected
 * at write time with the standard `422 VALIDATION_001` + `details[]`.
 */
export const DECORATION_VERSION = 1;
export const BLOCK_TYPES = [
  'hero',
  'rich_text',
  'image',
  'product_grid',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const DECORATION_LIMITS = {
  MAX_BLOCKS: 20,
  HERO_MIN_IMAGES: 1,
  HERO_MAX_IMAGES: 5,
  GRID_MIN_IDS: 1,
  GRID_MAX_IDS: 12,
  /** Serialized JSON byte cap (enforced in the service, not the DTO). */
  MAX_BYTES: 16 * 1024,
} as const;

class ThemeDto {
  @ApiPropertyOptional({ example: '#22c55e' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'accent must be a hex color like #22c55e',
  })
  accent?: string;
}

class CtaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  label: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  href: string;
}

class HeroBlockDataDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(DECORATION_LIMITS.HERO_MIN_IMAGES)
  @ArrayMaxSize(DECORATION_LIMITS.HERO_MAX_IMAGES)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  heading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @ApiPropertyOptional({ type: CtaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CtaDto)
  cta?: CtaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;
}

class RichTextBlockDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heading?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body: string;

  @ApiPropertyOptional({ enum: ['left', 'center'] })
  @IsOptional()
  @IsIn(['left', 'center'])
  align?: 'left' | 'center';
}

class ImageBlockDataDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  alt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  href?: string;

  @ApiPropertyOptional({ enum: ['wide', 'square', 'tall'] })
  @IsOptional()
  @IsIn(['wide', 'square', 'tall'])
  ratio?: 'wide' | 'square' | 'tall';
}

class ProductGridBlockDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(DECORATION_LIMITS.GRID_MIN_IDS)
  @ArrayMaxSize(DECORATION_LIMITS.GRID_MAX_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  product_ids: number[];

  @ApiPropertyOptional({ enum: [2, 3, 4] })
  @IsOptional()
  @IsIn([2, 3, 4])
  columns?: 2 | 3 | 4;
}

/** Maps a block type to the DTO class that validates its `data` payload. */
const BLOCK_DATA_DTOS: Record<BlockType, new () => object> = {
  hero: HeroBlockDataDto,
  rich_text: RichTextBlockDataDto,
  image: ImageBlockDataDto,
  product_grid: ProductGridBlockDataDto,
};

/**
 * Validates `block.data` against the DTO matching the sibling `block.type`.
 * A custom constraint (repo precedent: `common/validators/is-image-path`) is
 * used instead of class-transformer discriminator because `type` lives outside
 * `data`, so a discriminator at the `data` level cannot select the subclass.
 */
@ValidatorConstraint({ async: false })
class IsBlockDataConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const block = args.object as { type?: unknown };
    const type = block.type;
    if (typeof type !== 'string' || !(type in BLOCK_DATA_DTOS)) {
      // Unknown type is reported by the @IsIn on `type`; skip here.
      return true;
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const DtoClass = BLOCK_DATA_DTOS[type as BlockType];
    const instance = plainToInstance(DtoClass, value);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    return errors.length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    const block = args.object as { type?: unknown };
    return `Invalid data for block type "${String(block.type)}"`;
  }
}

function IsBlockData(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBlockDataConstraint,
    });
  };
}

class BlockDto {
  @ApiProperty()
  @IsString()
  @Length(6, 40)
  id: string;

  @ApiProperty({ enum: BLOCK_TYPES })
  @IsIn(BLOCK_TYPES)
  type: BlockType;

  @ApiProperty({ description: 'Per-type payload; validated against `type`.' })
  @IsBlockData()
  data: unknown;
}

export class DecorationConfigDto {
  @ApiProperty({ example: DECORATION_VERSION })
  @Equals(DECORATION_VERSION)
  version: number;

  @ApiPropertyOptional({ type: ThemeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeDto)
  theme?: ThemeDto;

  @ApiProperty({ type: [BlockDto] })
  @IsArray()
  @ArrayMaxSize(DECORATION_LIMITS.MAX_BLOCKS)
  @ArrayUnique((block: BlockDto) => block.id, {
    message: 'block ids must be unique',
  })
  @ValidateNested({ each: true })
  @Type(() => BlockDto)
  blocks: BlockDto[];
}
