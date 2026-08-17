class ApiError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
