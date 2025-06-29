const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  // Set the status code to the error status or default to 500
  res.status(statusCode);
  console.log("################~~~~~~~~~~~~~");
  console.log(err);
  console.log("################~~~~~~~~~~~~~");

  res.json({
    success: err.success || false,
    message: err.message || "Internal Server Error",
    staack: err.stack,
    target: err.target || null,
  });
};

module.exports = {
  errorHandler,
};
