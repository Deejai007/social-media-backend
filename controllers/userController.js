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

// Nodemailer init
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.m_email,
    pass: process.env.m_password,
  },
});

// create access token
const createAccessToken = (userData) => {
  return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};
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
    let { username, email, password, firstName, lastName } = req.body;
    email = email.toLowerCase();
    const userCount = await User.count({
      where: {
        email: email,
      },
    });
    if (!userCount) {
      const usernameCheck = await User.count({
        where: {
          username: username,
        },
      });
      if (!usernameCheck) {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        const user = await User.create({
          username,
          email,
          password: hash,
          firstName,
          lastName,
        });
        const otp_gen = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          specialChars: false,
          lowerCaseAlphabets: false,
        });
        const opt = await OtpModel.create({
          email,
          otp: otp_gen,
        });
        const mailoptions = {
          from: process.env.m_email,
          to: email,
          subject: `${process.env.pro_name} Verification OTP`,
          html: `
                    <divz
                        class="container"
                        style="max-width: 90%; margin: auto; padding-top: 20px"
                    >
                        <h2>Dear ${firstName}</h2>
                        <h4>You are About to be a Member </h4>
                        <p style="margin-bottom: 30px;"> To complete the registration process, please use the following OTP to verify your email address:</p>
                        <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp_gen}</h1>
                    </divz>
                `,
        };
        transporter.sendMail(mailoptions, (err, info) => {
          if (err) {
            console.log(err);

            return next(
              new CustomError(
                "There was an error sending OTP to email for verification!",
                500
              )
            );
          } else {
            console.log("Mail sent");
          }
        });
        res.status(200).json({
          success: true,
          user: user.toJSON(),
          msg: "OTP sent to  email!",
        });
      } else {
        return next(
          new CustomError(
            "This username is not available.Please choose new username!",
            false,
            400
          )
        );
      }
    } else {
      return next(new CustomError("User with this exist", false, 400));
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
        email: email,
      },
    });

    if (!user_db) {
      // return res.status(400).json({ success: false, msg: "User not found!" });
      return next(new CustomError("User not found!", 400));
    }

    if (user_db.verified) {
      return res
        .status(200)

        .json({ success: true, msg: "User already verified!" });
      // return next(new CustomError("User already verified!", 400));
    }

    if (!otp_db) {
      // return res
      //   .status(400)
      //   .json({ success: false, msg: "OTP timed out. Please resend OTP!" });
      return next(new CustomError("OTP timed out. Please resend OTP!", 400));
    }

    if (otp_db.otp === otp) {
      user_db.verified = true;
      await user_db.save();
      await otp_db.destroy();

      const mailoptions = {
        from: process.env.m_email,
        to: email,
        subject: `Dear Customer, sign up to your ${process.env.pro_name} account is successful!`,
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
        msg: "User verified",
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
        email: email,
      },
    });
    const new_otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    if (!otp_db) {
      const new_otp_db = await OtpModel.create({ email, otp: new_otp });
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
      msg: "mail sent",
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
    };
    const accesstoken = createAccessToken(userData);
    console.log();

    res.status(200).json({
      success: true,
      msg: "Login successful",
      accesstoken,
      id: user_db.id,
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
        email: email,
      },
    });
    const new_otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    if (!otp_db) {
      const new_otp_db = await OtpModel.create({ email, otp: new_otp });
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
      msg: "OTP sent to email!",
      id: user_db._id,
    });
  }),

  // // forgot password- verify OTP
  // forgotverify: asyncHandler(async (req, res, next) => {
  //   const { email, otp } = req.body;
  //   const user_db = await User.findOne({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   if (!user_db)
  //     return next(
  //       new CustomError("No user found! Please register first.", 400)
  //     );
  //   const userotp_db = await OtpModel.findOne({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   if (!userotp_db) return next(new CustomError("OTP timed out!", 400));
  //   if (userotp_db.otp == otp) {
  //     userotp_db.verify = true;
  //     user_db.verified = true;
  //     await userotp_db.save();
  //     res.status(200).json({
  //       success: true,
  //       msg: "OTP user verified",
  //     });
  //   } else return next(new CustomError("OTP is incorrect", 400));
  // }),
  // // forgot password- reset password
  // resetpass: asyncHandler(async (req, res, next) => {
  //   console.log(req.route.path);
  //   const { email, password } = req.body;
  //   const user_db = await User.findOne({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   if (!user_db) throw new Error("No user found!");
  //   const userotp_db = await OtpModel.findOne({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   if (!userotp_db)
  //     return next(
  //       new CustomError("OTP times out! Please resend otp to verify.", 400)
  //     );
  //   if (userotp_db.verify == true) {
  //     const result = await bcrypt.compare(password, user_db.password);
  //     if (result)
  //       return next(
  //         new CustomError("New password cannot be same as old password", 400)
  //       );
  //     // const passwordHash = await bcrypt.hash(password, 12);
  //     const salt = await bcrypt.genSalt(12);
  //     const hash = await bcrypt.hash(password, salt);
  //     user_db.password = hash;
  //     await user_db.save();
  //     userotp_db.verify = false;
  //     await userotp_db.save();

  //     res.status(200).json({
  //       success: true,
  //       msg: "password changed successfully",
  //     });
  //   } else
  //     return next(
  //       new CustomError("OTP verification incomplete! Please try again.", 400)
  //     );
  // }),
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

    const userOtp = await OtpModel.findOne({ where: { email } });
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
      return next(
        new CustomError("OTP already verified! Please resend OTP ", true, 200)
      );
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
      .json({ success: true, msg: "Password reset successful." });
    // } catch (error) {
    //   console.log("====================================");
    //   console.log(error);
    //   console.log("====================================");
    //   // console.log(error);

    //   return next(new CustomError(error, false, 500));
    // }
  }),
};
module.exports = userController;
