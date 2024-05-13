const { check, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const otpmodel = require("../models").otpmodel;
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
const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};
const userController = {
  // test
  test: asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user_db = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!user_db) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    await user_db.save();
  }),
  // new user register
  register: async (req, res) => {
    try {
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
          const opt = await otpmodel.create({
            email,
            otp: otp_gen,
          });

          const mailoptions = {
            from: process.env.m_email,
            to: email,
            subject: `${process.env.pro_name} Verification OTP`,
            html: `
          <div
            class="container"
            style="max-width: 90%; margin: auto; padding-top: 20px"
          >
            <h2>Dear ${firstName}</h2>
            <h4>You are About to be a Member </h4>
            <p style="margin-bottom: 30px;"> To complete the registration process, please use the following OTP to verify your email address:</p>
            <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp_gen}</h1>
       </div>
        `,
          };
          transporter.sendMail(mailoptions, (err, info) => {
            if (err) {
              console.log(err);
              res.status(400).json({
                success: false,
                msg: "There was an error sending OTP to email for verification!",
              });
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
          res.status(400).json({
            success: false,
            msg: "This username is not available.Please choose new username!",
          });
        }
      } else {
        res.status(400).json({
          success: false,
          msg: "A user with the email already exists!",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  },

  // Verify Email using OTP
  verify: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });
      const otp_db = await otpmodel.findOne({
        where: {
          email: email,
        },
      });
      if (user_db.verified) throw new Error("User already verified!");
      if (!user_db) throw new Error("User not found!");
      if (!otp_db) throw new Error("OTP timed out. Please resend OTP!");
      if (otp_db.otp == otp) {
        user_db.verified = true;
        await user_db.save();
        await otp_db.destroy();
        const mailoptions = {
          from: process.env.m_email,
          to: email,
          subject: `Dear Customer, sign up to your ${process.env.pro_name} account is successfull !`,
          html: `
        <div
          class="container"
          style="max-width: 90%; margin: auto; padding-top: 20px; "
        >
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
            console.log("mail sent");
          }
        });
        const accesstoken = createAccessToken({ id: user_db._id });
        res.status(200).json({
          success: true,
          msg: "user verified",
          id: user_db._id,
          accesstoken,
        });
      } else res.status(400).json({ success: false, msg: "OTP incorrect" });
    } catch (error) {
      // console.log(error);
      res.status(400).json({ success: false, msg: error.message });
    }
  },

  // verify by sending otp
  sendotp: async (req, res) => {
    try {
      const { email } = req.body;
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user_db) throw new Error("No user found!");
      if (user_db.verified) throw new Error("User already verified!");
      const otp_db = await otpmodel.findOne({
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
        const new_otp_db = await otpmodel.create({ email, otp: new_otp });
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
          throw new Error("Mail not sent");
        } else {
          console.log("mail sent");
        }
      });
      res.status(200).json({
        success: true,
        msg: "mail sent",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ success: false, msg: error.message });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      let { email, password } = req.body;
      email = email.toLowerCase();
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });

      if (!user_db) throw new Error("Invalid credentials!");
      if (!user_db.verified)
        throw new Error("User Not Verified! Pleae verify first");
      const result = await bcrypt.compare(password, user_db.password);
      if (!result) throw new Error("Invalid credentials!");
      const accesstoken = createAccessToken({ id: user_db._id });
      res.status(200).json({
        success: true,
        msg: "Login successful",
        accesstoken,
        id: user_db._id,
      });
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  },
  // forgot password- send OTP
  forgotsendotp: async (req, res) => {
    try {
      const { email } = req.body;
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user_db) throw new Error("No user found!");
      const otp_db = await otpmodel.findOne({
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
        const new_otp_db = await otpmodel.create({ email, otp: new_otp });
      } else {
        otp_db.otp = new_otp;
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
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  },

  // forgot password- verify OTP
  forgotverify: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user_db) throw new Error("No user found!");
      const userotp_db = await otpmodel.findOne({
        where: {
          email: email,
        },
      });
      if (!userotp_db) throw new Error("OTP timed out.");
      if (userotp_db.otp == otp) {
        userotp_db.verify = true;
        user_db.verified = true;
        await userotp_db.save();
        res.status(200).json({
          success: true,
          msg: "OTP user verified",
        });
      } else res.status(400).json({ success: false, msg: "OTP incorrect" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ success: false, msg: error.message });
    }
  },
  // forgot password- reset password
  resetpass: async (req, res) => {
    try {
      console.log(req.route.path);
      const { email, password } = req.body;
      const user_db = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user_db) throw new Error("No user found!");
      const userotp_db = await otpmodel.findOne({
        where: {
          email: email,
        },
      });
      if (!userotp_db) throw new Error("Verification Timed OUT");
      if (userotp_db.verify == true) {
        const result = await bcrypt.compare(password, user_db.password);
        if (result)
          throw new Error("New password cannot be same as old password");
        // const passwordHash = await bcrypt.hash(password, 12);
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        user_db.password = hash;
        await user_db.save();
        userotp_db.verify = false;
        await userotp_db.save();

        res.status(200).json({
          success: true,
          msg: "password changed successfully",
        });
      } else
        res.status(400).json({
          success: false,
          msg: "OTP verification Incomplete,please try again",
        });
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
      console.log(error);
    }
  },
};
module.exports = userController;
