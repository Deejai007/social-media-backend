const { check, validationResult } = require("express-validator");
const CustomError = require("../helpers/customError");
const { getUserDataFromToken } = require("../helpers/auth/authutils");
// const { errorHandler } = require("../middleware/errorMiddleware");
const asyncHandler = require("express-async-handler");
const OtpModel = require("../models").OtpModel;
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const User = require("../models").User;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const userController = {
  // user
  follow: asyncHandler(async (req, res, next) => {
    const { srcUser, targeUser } = req.body;
  }),
};
module.exports = userController;
