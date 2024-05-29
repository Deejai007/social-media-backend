const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  // Set the status code to the error status or default to 500
  res.status(statusCode);
  console.log(err.stack);

  res.json({
    success: err.success || false,
    message: err.message || "Internal Server Errordj",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = {
  errorHandler,
};
