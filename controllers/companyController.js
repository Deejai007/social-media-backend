const { check, validationResult } = require("express-validator");
const CustomError = require("../helpers/customError");
// const { errorHandler } = require("../middleware/errorMiddleware");
const asyncHandler = require("express-async-handler");

require("dotenv").config();

const companyController = {
  // test
  test: asyncHandler(async (req, res, next) => {
    // try {
    // throw new CustomError("Test error message ", false, 404);
    return next(new CustomError("Company test", true, 200));
    // } catch (error) {
    console.log(error);

    // next(error);
    // }
  }),
  addCompany: asyncHandler(async (req, res, next) => {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  }),
};
module.exports = companyController;
