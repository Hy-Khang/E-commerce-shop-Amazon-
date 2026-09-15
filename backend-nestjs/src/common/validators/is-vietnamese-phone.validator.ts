import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsVietnamesePhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(value);
  }

  defaultMessage(): string {
    return 'Phone number must be a valid Vietnamese phone number';
  }
}

export function IsVietnamesePhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsVietnamesePhoneConstraint,
    });
  };
}
