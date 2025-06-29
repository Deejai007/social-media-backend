class CustomError extends Error {
  constructor(message, success, status, obj) {
    console.log("-----------");
    console.log("CustomError:", message, success, status, obj);
    console.log("-----------");
    super(message);
    this.status = status;
    this.success = success;
    this.name = CustomError.name;
    this.target = obj.target;
  }
}

module.exports = CustomError;
