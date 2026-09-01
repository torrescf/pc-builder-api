import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { APIError } from '../helpers/api-errors';

export const errorMiddleware = (
  error: Error & Partial<APIError>,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Erros de validação do Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Erros controlados da API
  const statusCode = error.statusCode ?? 500;

  const message = error.statusCode
    ? error.message
    : 'Erro interno do servidor';

  if (statusCode === 500) {
    console.error('[Internal Server Error]:', error);
  } else {
    console.warn(
      `[API Warning - Status ${statusCode}]: ${error.message}`
    );
  }

  return res.status(statusCode).json({
    error: message,
  });
};