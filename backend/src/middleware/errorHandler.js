export function errorHandler(error, req, res, next) {
  console.error('Error:', error.message, error.stack);
  
  const status = error.status || 500;
  const message = error.message || 'Error interno del servidor';
  
  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}