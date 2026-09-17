export class APIError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends APIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class OutOfStockError extends APIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Não autorizado. Token ausente ou inválido.') {
    super(message, 401);
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Acesso negado. Permissão insuficiente.') {
    super(message, 403);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class CompatibilityError extends APIError {
  constructor(message: string) {
    super(message, 422);
  }
}
