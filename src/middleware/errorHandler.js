export const errorHandler = (err, req, res, next) => {
  console.error("Server side error", err);

  const status = err.status || 500;
  const message = err.message || "Server side error";

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
