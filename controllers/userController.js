const { createAccessToken } = require("../helpers/auth/authutils");
const { check, validationResult } = require("express-validator");
const { OtpModel, User, Follow } = require("../models");
const CustomError = require("../helpers/customError");
const asyncHandler = require("express-async-handler");
const otpGenerator = require("otp-generator");
const logger = require("../helpers/logger");
const mailQueue = require("../helpers/mailqueue");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

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
    logger.log(user_db);
    const isFollowingRecord = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId: user_db.id,
      },
    });
    // logger.log(isFollowing);

    const followerCount = await Follow.count({
      where: { followingId: user_db.id },
    });
    const followingCount = await Follow.count({
      where: { followerId: user_db.id },
    });

    const userResponse = {
      ...user_db.toJSON(),
      isFollowing: isFollowingRecord?.status || null,
      followerCount,
      followingCount,
    };

    res.status(200).json({
      success: true,
      data: { user: userResponse },
    });
  }),

  // add user data
  addUserData: asyncHandler(async (req, res, next) => {
    const userData = req.user;

    if (!userData) return next(new CustomError("Not authorized1", false, 401));
    logger.log(req.body.formData);
    const { formData } = req.body;
    // logger.log("Formdata: ", formData);
    if (!formData) return next(new CustomError("Not authorized2", false, 401));

    const usernameCheck = await User.findOne({
      where: { username: formData.username },
    });
    if (usernameCheck) {
      return next(
        new CustomError(
          "Username is already taken. Choose a different username",
          false,
          401,
          { target: "username" }
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
        secure: process.env.production === "true", // true in production (HTTPS), false in dev
        sameSite: process.env.production === "true" ? "None" : "lax", // None for cross-site prod, lax for dev
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
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

      const mailOptions = {
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

      await mailQueue.add("sendMail", mailOptions);
      logger.log("Mail task queued");
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
        secure: process.env.production === "true", // true in production (HTTPS), false in dev
        sameSite: process.env.production === "true" ? "None" : "lax", // None for cross-site prod, lax for dev
        maxAge: 1000 * 60 * 60 * 24, // 1 day
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

    const mailOptions = {
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

    await mailQueue.add("sendMail", mailOptions);
    logger.log("Mail task queued");

    res.status(200).json({
      success: true,
      message: "Verification Mail sent to email! new",
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

    // logger.log(password);
    //logger.log(user_db);

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
      secure: process.env.production === "true", // true in production (HTTPS), false in dev
      sameSite: process.env.production === "true" ? "None" : "lax", // None for cross-site prod, lax for dev
      maxAge: 1000 * 60 * 60 * 24, // 1 day
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
      // user_db.resetPasswordExpires = Date.now();
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
    logger.log(process.env.CLIENT_URL + "/password-reset/" + token);
    const mailOptions = {
      to: email,
      from: process.env.m_email,
      subject: "Password reset request.",
      text: `You are receiving this because you have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      <a href="${process.env.CLIENT_URL}/password-reset/${token}">Reset Password</a>\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await mailQueue.add("sendMail", mailOptions);
    logger.log("Mail task queued");
    await user_db.save();
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

    module.exports = userController;
    user_db.resetPasswordToken = null;
    await user_db.save();
    return res
      .status(200)
      .json({ success: true, message: "Password successfully changed!" });
  }),
  //  verifying token and resetting password
  getFeed: asyncHandler(async (req, res, next) => {
    let username = req.params.username;

    if (!username) {
      return next(new CustomError("Unable to fetch feed!", false, 401));
    }

    return res
      .status(200)
      .json({ success: true, message: "Password successfully changed!" });
  }),
};
module.exports = userController;
