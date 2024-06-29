const { check, validationResult } = require("express-validator");
const CustomError = require("../helpers/customError");
const { body } = require("express-validator");
const {
  getUserDataFromToken,
  createAccessToken,
} = require("../helpers/auth/authutils");
// const { errorHandler } = require("../middleware/errorMiddleware");
const asyncHandler = require("express-async-handler");
const OtpModel = require("../models").OtpModel;
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const User = require("../models").User;
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
require("dotenv").config();

// Nodemailer init
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.m_email,
    pass: process.env.m_password,
  },
});

const userController = {
  // get user data
  getUser: asyncHandler(async (req, res, next) => {
    const userData = getUserDataFromToken(req.headers.authorization);
    console.log(userData);
    if (!userData) return next(new CustomError("Not authorized", false, 401));
    const user_db = await User.findOne({ id: userData.id });
    if (!user_db) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, data: user_db });
  }),

  // new user register
  register: asyncHandler(async (req, res, next) => {
    // let { username, email, password, firstName, lastName } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new CustomError(errors.array()[0].message, false, 400));
    }
    let { email, password } = req.body;
    email = email.toLowerCase();
    const userCount = await User.count({
      where: {
        email: email,
      },
    });
    if (!userCount) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      const user = await User.create({
        email,
        password: hash,
      });

      const userData = {
        id: user_db.id,
        username: user_db.firstName,
        email: user_db.email,
        verified: user_db.verified,
      };
      const accesstoken = createAccessToken(userData);
      console.log();
      res.status(200).json({
        success: true,
        message: "Registration successful",
        data: {
          accesstoken,
          user: user_db,
        },
      });
    } else {
      return next(
        new CustomError(
          "This email is already registered.Please login!",
          false,
          400
        )
      );
    }
  }),

  // Verify Email using OTP
  verify: asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });

    const otp_db = await OtpModel.findOne({
      where: {
        userEmail: email,
      },
    });

    if (!user_db) {
      return next(new CustomError("User not found!", 400));
    }

    if (user_db.verified) {
      return res
        .status(200)
        .json({ success: true, message: "User already verified!" });
    }

    if (!otp_db) {
      return next(new CustomError("OTP timed out. Please resend OTP!", 400));
    }

    if (otp_db.otp === otp) {
      user_db.verified = true;
      await user_db.save();
      await otp_db.destroy();

      const mailoptions = {
        from: process.env.m_email,
        to: email,
        subject: `Email verification- ${process.env.pro_name} !`,
        html: `
          <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px;">
            <h2>Welcome to the club. ${user_db.firstName}</h2>
            <h4>You are hereby declared a member of Foodora.</h4>
            <p style="margin-bottom: 30px;">We are really happy to welcome you to our growing family of food lovers. Thank you for showing your interest in our services.</p>
          </div>
        `,
      };

      transporter.sendMail(mailoptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Mail sent");
        }
      });

      // const accessToken = createAccessToken({ id: user_db._id });
      res.status(200).json({
        success: true,
        message: "User verified",
        id: user_db._id,
        // accessToken,
      });
    } else {
      return next(new CustomError("OTP incorrect", 401));
    }
  }),

  // verify by sending otp
  sendotp: asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!user_db) return next(new CustomError("No user found!", false, 400));
    if (user_db.verified)
      return next(new CustomError("User already verified!", true, 200));
    const otp_db = await OtpModel.findOne({
      where: {
        userEemail: email,
      },
    });
    const new_otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    if (!otp_db) {
      const new_otp_db = await OtpModel.create({
        userEmail: email,
        otp: new_otp,
      });
    } else {
      otp_db.otp = new_otp;
      await otp_db.save();
    }

    const mailoptions = {
      from: process.env.m_email,
      to: email,
      subject: `${process.env.pro_name} - OTP for Verification `,
      html: `
          <div
            class="container"
            style="max-width: 90%; margin: auto; padding-top: 20px"
          >
            <h2>Dear ${user_db.firstName}</h2>
           
            <p style="margin-bottom: 30px;"> To complete the verification process, please use the following OTP to verify your email address:</p>
            <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${new_otp}</h1>
       </div>
        `,
    };
    transporter.sendMail(mailoptions, (err, info) => {
      if (err) {
        console.log(err);
        return next(new CustomError("Error sending mail!", 500));
        // throw new Error("Mail not sent");
      } else {
        console.log("mail sent");
      }
    });
    res.status(200).json({
      success: true,
      message: "mail sent",
    });
  }),

  // User login
  login: asyncHandler(async (req, res, next) => {
    let { email, password } = req.body;
    email = email.toLowerCase();
    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user_db || !password) {
      return next(new CustomError("Invalid Credentials", false, 401));
    }
    if (!user_db.verified)
      return next(
        new CustomError("User Not Verified! Pleae verify first", false, 403)
      );

    console.log(password);
    console.log(user_db.password);

    const result = await bcrypt.compare(password, user_db.password);
    if (!result)
      return next(new CustomError("Invalid Credentials2", false, 401));
    const userData = {
      id: user_db.id,
      username: user_db.firstName,
      email: user_db.email,
      verified: user_db.verified,
    };
    const accesstoken = createAccessToken(userData);
    console.log();
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accesstoken,
        user: user_db,
      },
    });
  }),
  // forgot password- send OTP
  forgotsendotp: asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!user_db)
      return next(
        new CustomError("User not found! Please register first", false, 400)
      );
    const otp_db = await OtpModel.findOne({
      where: {
        userEmail: email,
      },
    });
    const new_otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    if (!otp_db) {
      const new_otp_db = await OtpModel.create({
        userEmail: email,
        otp: new_otp,
      });
    } else {
      otp_db.otp = new_otp;
      otp_db.verified = false;
      await otp_db.save();
    }
    const mailoptions = {
      from: process.env.m_email,
      to: email,
      subject: `${process.env.pro_name} - Forgot password `,
      html: `
        <div
          class="container"
          style="max-width: 90%; margin: auto; padding-top: 20px"
        >
          <h2>Dear ${user_db.firstName}</h2>
         
          <p style="margin-bottom: 30px;"> To change the password, please use the following OTP to verify your email :</p>
          <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${new_otp}</h1>
     </div>
      `,
    };
    transporter.sendMail(mailoptions, (err, info) => {
      if (err) {
        console.log(err);
        throw new Error("Mail not sent");
      } else {
        console.log("mail sent");
      }
    });
    console.log(new_otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to email!",
      id: user_db._id,
    });
  }),

  //  verifying OTP and resetting password
  forgotresetPassword: asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    // try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(
        new CustomError("No user found! Please register first.", false, 400)
      );
    }

    const userOtp = await OtpModel.findOne({ where: { userEmail: email } });
    if (!userOtp || !newPassword) {
      return next(
        new CustomError("Error Occured! Please try again", false, 400)
      );
    }

    if (userOtp.otp !== otp) {
      return next(
        new CustomError(
          "Incorrect OTP! Please verify and try again.",
          false,
          400
        )
      );
    }

    if (userOtp.verify) {
      return next(new CustomError("Please resend otp.", true, 200));
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    // const isSamePassword = await bcrypt.compare(hash, user.password);
    const isSamePassword = newPassword == user.password;
    if (isSamePassword) {
      return next(
        new CustomError(
          "New password cannot be the same as the old password.",
          false,
          400
        )
      );
    }
    user.password = hash;
    await user.save();

    userOtp.verify = true;
    await userOtp.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful." });
  }),
};
module.exports = userController;
