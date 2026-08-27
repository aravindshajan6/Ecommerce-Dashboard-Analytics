/** Central error handler: `{ success: false, message }` with the error's status (default 500). */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = Number(err.status) || Number(err.statusCode) || 500;
  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ success: false, message: err.message || "Internal Server Error" });
}

export function notFoundApi(req, res) {
  res.status(404).json({ success: false, message: `No API route for ${req.method} ${req.originalUrl}` });
}
