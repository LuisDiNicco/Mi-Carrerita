// server/src/common/utils/validators.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validar que un email sea válido
 */
@ValidatorConstraint({ name: 'isValidEmail', async: false })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  defaultMessage() {
    return 'Email ($value) is invalid';
  }
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailConstraint,
    });
  };
}

/**
 * Validar que un valor sea un UUID v4
 */
@ValidatorConstraint({ name: 'isUUID', async: false })
export class IsUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    const uuidv4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(value);
  }

  defaultMessage() {
    return '$value is not a valid UUID v4';
  }
}

export function IsUUID(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUUIDConstraint,
    });
  };
}

/**
 * Validar que el valor esté en una lista de opciones (mejorado)
 */
export function IsInEnum(enumType: any, validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [Object.values(enumType)],
      validator: {
        validate(value: string) {
          return Object.values(enumType).includes(value);
        },
        defaultMessage() {
          return `${propertyName} must be one of: ${Object.values(enumType).join(', ')}`;
        },
      },
    });
  };
}

/**
 * Validar que un string sea una URL válida
 */
@ValidatorConstraint({ name: 'isValidURL', async: false })
export class IsValidURLConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return '$value is not a valid URL';
  }
}

export function IsValidURL(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidURLConstraint,
    });
  };
}
