/** Standard operational app error with HTTP semantics. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * Creates an application-level operational error.
   * @param message Human-readable message.
   * @param statusCode HTTP status code to return.
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
