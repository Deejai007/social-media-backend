const { check, validationResult } = require("express-validator");
const CustomError = require("../helpers/customError");
const { getUserDataFromToken } = require("../helpers/auth/authutils");
// const { errorHandler } = require("../middleware/errorMiddleware");
const asyncHandler = require("express-async-handler");
const OtpModel = require("../models").OtpModel;
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const { User, Follow } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { raw } = require("express");
require("dotenv").config();

const followController = {
  // follow user - send request
  sendFollowReq: asyncHandler(async (req, res, next) => {
    const { followingId } = req.body;
    console.log(followingId);
    console.log(req.user);

    if (followingId == req.user.id) {
      return next(new CustomError("Cant follow yourself!", false, 401));
    }
    let follow_db = await Follow.findOne({
      where: { followerId: req.user.id, followingId: followingId },
    });
    if (follow_db) {
      return next(
        new CustomError("Follow request already pending", false, 401)
      );
    }

    let follow_new = await Follow.create({
      followerId: req.user.id,
      followingId: followingId,
      status: "pending",
    });
    res.json({
      success: true,
      message: "Follow request sent!",
      data: follow_new,
    });
  }),

  // follow user - acccept request
  acceptFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;
    console.log(followerId);

    if (followerId == req.user.id) {
      return next(new CustomError("Cant follow yourself!", false, 401));
    }
    let follow_db = await Follow.findOne({
      where: { followerId: followerId, followingId: req.user.id },
    });
    if (!follow_db) {
      return next(new CustomError("Error accepting request.1", false, 401));
    }
    follow_db.status = "accepted";
    await follow_db.save();
    res.json({
      success: true,
      message: "Follow request accepted",
      data: follow_db,
    });
  }),
  // follow user - decline request
  rejectFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;
    console.log(followerId);

    if (followerId == req.user.id) {
      return next(new CustomError("Cant follow yourself!", false, 401));
    }
    let follow_db = await Follow.findOne({
      where: { followerId: followerId, followingId: req.user.id },
    });
    if (!follow_db) {
      return next(new CustomError("Error accepting request.1", false, 401));
    }
    await follow_db.destroy();
    res.json({
      success: true,
      message: "Follow request rejected",
      data: {},
    });
  }),
  // get all pending requests
  getPendingRequests: asyncHandler(async (req, res, next) => {
    const pendingRequests = await Follow.findAll({
      where: { followingId: req.user.id, status: "pending" },
      include: [
        {
          model: User,
          as: "follower", // Assuming your User model is named 'User' and has an alias 'follower'
          attributes: [
            "id",
            "username",
            "email" /* Add other attributes you need */,
          ],
        },
      ],
      attributes: [], // dont include any attributes of the model instance
      raw: true, //dont return instance of the model just return raw db object
    });
    res.json({ success: true, message: "", data: pendingRequests });
  }),
};
module.exports = followController;
