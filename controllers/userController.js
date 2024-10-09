const { createAccessToken } = require("../helpers/auth/authutils");
const { check, validationResult } = require("express-validator");
const { OtpModel, User, Follow } = require("../models");
const CustomError = require("../helpers/customError");
const asyncHandler = require("express-async-handler");
const otpGenerator = require("otp-generator");
const logger = require("../helpers/logger");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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
    let username = req.params.username;

    if (!username) {
      return next(new CustomError("Unable to fetch data", false, 401));
    }
    const user_db = await User.findOne({ where: { username: username } });
    if (!user_db) {
      return next(new CustomError("Unable to fetch data", false, 401));
    }
    const isFollowing = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId: user_db.id,
      },
    });

    res
      .status(200)
      .json({ success: true, data: { user: user_db, isFollowing } });
  }),

  // add user data
  addUserData: asyncHandler(async (req, res, next) => {
    const userData = req.user;

    if (!userData) return next(new CustomError("Not authorized1", false, 401));
    // logger.log(req.body.formData);
    const { formData } = req.body;
    // logger.log("Formdata: ", formData);
    if (!formData) return next(new CustomError("Not authorized2", false, 401));

    const usernameCheck = await User.findOne({
      where: { username: formData.username },
    });
    logger.log(usernameCheck);
    if (usernameCheck) {
      return next(
        new CustomError(
          "Username is already taken. Choose a different username",
          false,
          401
        )
      );
    }
    const user_db = await User.findOne({ where: { id: userData.id } });

    if (!user_db) {
      return res.status(404).json({ message: "User not found" });
    }
    // logger.log("user_db");
    await user_db.update(formData);
    // logger.log(user_db);

    res.status(200).json({
      success: true,
      message: "Profile created successfully!",
      data: user_db,
    });
  }),
  // new user register
  register: asyncHandler(async (req, res, next) => {
    // let { username, email, password, firstName, lastName } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(new CustomError(errors.array()[0].msg, false, 400));
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
      const user_db = await User.create({
        email,
        password: hash,
      });

      const userData = {
        id: user_db.id,
        username: null,
        email: user_db.email,
        verified: user_db.verified,
      };
      const accesstoken = createAccessToken(userData);

      res.cookie("token", accesstoken, {
        httpOnly: true,
        secure: process.env.production == "false",
        // sameSite: 'Strict',
      });
      logger.log();
      res.status(200).json({
        success: true,
        message: "Registration successful",
        data: {
          user: {
            about: user_db.about,
            firstName: user_db.firstName,
            email: user_db.email,
            id: user_db.id,
            lastName: user_db.lastName,
            profileImage: user_db.profileImage,
            updatedAt: user_db.updatedAt,
            createdAt: user_db.createdAt,
            username: user_db.username,
            verified: user_db.verified,
            location: user_db.location,
          },
        },
      });
    } else {
      return next(
        new CustomError(
          "A user with this email already exists. Please login!",
          false,
          400
        )
      );
    }
  }),

  // Verify Email using OTP
  verify: asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(new CustomError(errors.array()[0].msg, false, 400));
    }
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
      return res.status(200).json({ success: true, message: "User verified!" });
    }

    if (!otp_db) {
      return next(new CustomError("An error occured! Please resend OTP!", 400));
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
          logger.log(err);
        } else {
          logger.log("Mail sent");
        }
      });
      // send updated access token after verification
      const userData = {
        id: user_db.id,
        username: null,
        email: user_db.email,
        verified: user_db.verified,
      };
      const accesstoken = createAccessToken(userData);

      res.cookie("token", accesstoken, {
        httpOnly: true,
        secure: process.env.production == "false",
        // sameSite: 'Strict',
      });

      res.status(200).json({
        success: true,
        message: "User verified",
        data: {
          id: user_db.id,
        },
      });
    } else {
      return next(new CustomError("OTP incorrect", false, 401));
    }
  }),
  // send otp for verification
  sendotp: asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    logger.log("sending email for ", email);
    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!user_db)
      return next(
        new CustomError("An error occured! Please login again.", false, 400)
      );
    if (user_db.verified)
      return next(new CustomError("User already verified!", true, 200));
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
      await otp_db.save();
    }
    logger.log(new_otp);

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
        logger.log(err);
        return next(
          new CustomError("Error sending mail! Please try again later!", 500)
        );
        // throw new Error("Mail not sent");
      } else {
        logger.log("Verification code sent to Email!");
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

    logger.log(password);
    logger.log(user_db.password);

    const result = await bcrypt.compare(password, user_db.password);
    if (!result)
      return next(new CustomError("Invalid Credentials!", false, 401));
    const userData = {
      id: user_db.id,
      username: user_db.firstName,
      email: user_db.email,
      verified: user_db.verified,
    };
    const accesstoken = createAccessToken(userData);
    res.cookie("token", accesstoken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user_db,
      },
    });
  }),
  // forgot password- send reset token
  forgotpassword: asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(new CustomError(errors.array()[0].msg, false, 400));
    }
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
    if (user_db.resetPasswordExpires > Date.now()) {
      return next(
        new CustomError(
          "Email is already sent! If not received, try again after some time!",
          false,
          400
        )
      );
    }
    const token = crypto.randomBytes(20).toString("hex");
    user_db.resetPasswordToken = token;
    user_db.resetPasswordExpires = Date.now() + 900000; // 15 minutes
    await user_db.save();

    const mailOptions = {
      to: email,
      from: process.env.m_email,
      subject: "Password reset request.",
      text: `You are receiving this because you have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${process.env.CLIENT_URL}/password-reset/${token} \n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        logger.log(err);
        throw new Error("Mail not sent");
      } else {
        logger.log("mail sent");
      }
    });

    res.status(200).json({
      success: true,
      message: "Password Change email sent!",
      id: user_db._id,
    });
  }),

  //  verifying token and resetting password
  forgotresetPassword: asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(new CustomError(errors.array()[0].msg, false, 400));
    }

    const { token, newPassword } = req.body;

    const user_db = await User.findOne({
      where: { resetPasswordToken: token },
    });
    if (!user_db) {
      return next(
        new CustomError(
          "Password reset token is invalid or has expired!",
          false,
          400
        )
      );
    }
    logger.log(user_db.email);
    if (!token || token !== user_db.resetPasswordToken) {
      return next(
        new CustomError(
          "Password reset token is invalid or has expired!",
          false,
          400
        )
      );
    }
    // check validity of token
    const currentTime = Date.now();

    if (currentTime > user_db.resetPasswordExpires) {
      return next(
        new CustomError("Reset password token expired! Try again!", false, 400)
      );
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    // const isSamePassword = await bcrypt.compare(hash, user.password);
    const isSamePassword = newPassword == user_db.password;
    if (isSamePassword) {
      return next(
        new CustomError(
          "New password cannot be the same as the old password.",
          false,
          400
        )
      );
    }
    user_db.password = hash;
    user_db.resetPasswordToken = null;
    await user_db.save();
    return res
      .status(200)
      .json({ success: true, message: "Password successfully changed!" });
  }),
};
module.exports = userController;
