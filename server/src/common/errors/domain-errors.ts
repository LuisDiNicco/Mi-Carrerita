export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class EntityNotFoundError extends DomainError {
    constructor(entity: string, id: string | number) {
        super(`${entity} with id '${id}' not found`);
    }
}

export class BusinessRuleViolationError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}

export class InvalidInputError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}
