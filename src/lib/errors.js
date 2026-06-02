/**
 * Base application error. Carries an HTTP status, a machine-readable code and
 * optional structured details, so route handlers can throw and let the central
 * error handler format a consistent response.
 */
export class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL_ERROR", details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, { status: 404, code: "NOT_FOUND" });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details) {
    super(message, { status: 400, code: "VALIDATION_ERROR", details });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, { status: 409, code: "CONFLICT" });
  }
}
