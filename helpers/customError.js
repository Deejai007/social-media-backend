class CustomError extends Error {
  constructor(message, success, status) {
    super(message);
    this.status = status;
    this.success = success;
    this.name = CustomError.name;
  }
}

module.exports = CustomError;
