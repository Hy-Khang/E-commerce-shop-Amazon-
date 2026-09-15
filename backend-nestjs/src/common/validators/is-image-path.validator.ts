import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isURL,
} from 'class-validator';

const UPLOAD_PATH_REGEX =
  /^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

@ValidatorConstraint({ async: false })
export class IsImagePathConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) return false;

    if (UPLOAD_PATH_REGEX.test(value)) return true;

    return isURL(value, {
      require_protocol: true,
      protocols: ['http', 'https'],
    });
  }

  defaultMessage(): string {
    return 'Must be a valid image URL or an uploaded image path';
  }
}

export function IsImagePath(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsImagePathConstraint,
    });
  };
}
