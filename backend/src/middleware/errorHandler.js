export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Not Found - ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};
