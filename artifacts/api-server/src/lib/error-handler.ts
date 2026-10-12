import type { ErrorRequestHandler } from "express";

/** Keep internal errors out of HTTP responses and request logs. */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const status = error?.status === 400 ? 400 : error?.status === 413 ? 413 : 500;
  req.log.error({ status }, "Request failed");
  res.status(status).json({
    error: status === 500
      ? "Something went wrong. Please try again."
      : "Invalid request body.",
  });
};
