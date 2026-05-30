function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Внутрішня помилка сервера' });
}

module.exports = { errorHandler };
