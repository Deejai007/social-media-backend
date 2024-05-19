const errorHandler = (err, req, res, next) => {
  console.log(res.statusCode);
  const statusCode = res.statusCode || 500;

  res.status(statusCode);

  res.status(statusCode).json({
    success: "false",
    message: err.message,
    djstack: err.stack,
  });
};

module.exports = {
  errorHandler,
};
