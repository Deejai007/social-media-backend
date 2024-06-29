const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 400;

  // Set the status code to the error status or default to 500
  res.status(statusCode);
  console.log("################~~~~~~~~~~~~~");
  console.log(err);
  console.log("################~~~~~~~~~~~~~");

  res.json({
    success: err.success || false,
    message: err.message || "Internal Server Errordj",
    staack: err.stack,
  });
};

module.exports = {
  errorHandler,
};
