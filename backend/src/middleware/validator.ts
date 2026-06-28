// ─────────────────────────────────────────────────────────────
// ResQNet — Zod Validation Middleware
// Generic request validation middleware using Zod schemas.
// Validates body, query, and params separately.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Express middleware factory that validates request parts against Zod schemas.
 * Returns 400 with structured error details on validation failure.
 *
 * @example
 * router.post('/incidents', validate({ body: createIncidentSchema }), controller.create);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    // Validate request body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.body = formatZodErrors(result.error);
        // Replace body with parsed data for type safety
      } else {
        req.body = result.data;
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.query = formatZodErrors(result.error);
      } else {
        req.query = result.data;
      }
    }

    // Validate URL parameters
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.params = formatZodErrors(result.error);
      } else {
        req.params = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    next();
  };
}

/**
 * Format Zod errors into human-readable strings.
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}
