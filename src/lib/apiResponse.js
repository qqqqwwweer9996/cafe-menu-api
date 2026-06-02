import { ZodError } from "zod";
import { AppError, ValidationError } from "./errors.js";

/**
 * Standard success envelope:
 *   { "success": true, "data": <payload>, "meta"?: <object> }
 */
export function ok(data, { status = 200, meta } = {}) {
  return Response.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  );
}

export function created(data, { meta } = {}) {
  return ok(data, { status: 201, meta });
}

/**
 * Standard error envelope:
 *   { "success": false, "error": { "code", "message", "details"? } }
 */
export function fail({
  status = 500,
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  details,
} = {}) {
  return Response.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

/**
 * Central error handler. Maps known error types to consistent responses so
 * every route handler can simply `catch (err) { return handleError(err); }`.
 */
export function handleError(err) {
  if (err instanceof ZodError) {
    return fail({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return fail({
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Unexpected error — log server-side, return a generic message to the client.
  console.error("[cafe-menu-api] Unhandled error:", err);
  return fail({});
}

/** Parse a JSON request body, raising a 400 ValidationError on malformed input. */
export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}
