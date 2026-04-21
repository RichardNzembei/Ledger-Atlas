export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super('not_found', `${entity} not found: ${id}`, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('conflict', message, 409);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'unauthorized') {
    super('unauthorized', message, 403);
  }
}

export class ConcurrencyError extends DomainError {
  constructor(
    public readonly streamId: string,
    public readonly expected: number,
    public readonly actual: number,
  ) {
    super(
      'concurrency_conflict',
      `Stream version mismatch: expected ${expected}, got ${actual}`,
      409,
    );
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super('validation_failed', message, 422);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly productId: string,
    public readonly locationId: string,
    public readonly available: number,
    public readonly requested: number,
  ) {
    super(
      'insufficient_stock',
      `Insufficient stock for product ${productId} at ${locationId}: have ${available}, need ${requested}`,
      409,
    );
  }
}
