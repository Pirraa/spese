import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log dell'errore
  console.error(err);

  // Errore di validazione Prisma
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Dati di input non validi';
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  // Errore di constraint unico Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = 'Risorsa già esistente';
    error = { name: 'DuplicateError', message, statusCode: 409 };
  }

  // Errore di risorsa non trovata
  if (err.name === 'NotFoundError') {
    const message = 'Risorsa non trovata';
    error = { name: 'NotFoundError', message, statusCode: 404 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Errore del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
