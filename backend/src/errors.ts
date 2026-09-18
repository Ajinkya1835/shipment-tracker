export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) =>
  new AppError(404, "NOT_FOUND", `${what} not found`);

export const conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(422, "UNPROCESSABLE", message, details);
