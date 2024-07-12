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
    const user1_db = await User.findOne({ where: { id: followerId } });
    const user2_db = await User.findOne({ where: { id: req.user.id } });
    if (!user1_db || !user2_db) {
      return next(new CustomError("Error accepting request.2", false, 401));
    }
    await user1_db.increment({
      followingCount: 1,
    });
    await user1_db.save();
    await user2_db.increment({
      followerCount: 1,
    });
    await user2_db.save();
    follow_db.status = "accepted";
    await follow_db.save();
    res.json({
      success: true,
      message: "Follow request accepted",
      data: follow_db,
    });
  }),

  // // ufollow user
  // unfollowUser: asyncHandler(async (req, res, next) => {
  //   const { followerId } = req.body;
  //   console.log(followerId);

  //   if (followerId == req.user.id) {
  //     return next(new CustomError("Cant unfollow yourself!", false, 401));
  //   }
  //   let follow_db = await Follow.findOne({
  //     where: { followerId: followerId, followingId: req.user.id },
  //   });
  //   if (!follow_db) {
  //     return next(new CustomError("Error accepting request.1", false, 401));
  //   }
  //   let username=
  //   await follow_db.destroy();
  //   res.json({
  //     success: true,
  //     message: '',
  //     data: follow_db,
  //   });
  // }),
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
          as: "followers", // Assuming your User model is named 'User' and has an alias 'follower'
          attributes: [
            "id",
            "username",
            "email" /* Add other attributes you need */,
          ],
        },
      ],
      attributes: [], // dont include any attributes of the model instance
      raw: true, //dont return instance of the model just return raw db object
      order: [["createdAt", "DESC"]], // get latest at top
    });
    res.json({ success: true, message: "", data: pendingRequests });
  }),

  // unfollow user-handles both unfollowing and remove follow request sent to the some user
  unfollowUser: asyncHandler(async (req, res, next) => {
    const { followingId } = req.body;
    console.log(followingId);

    if (followingId == req.user.id) {
      return next(new CustomError("Cant unfollow yourself!", false, 401));
    }
    let follow_db = await Follow.findOne({
      where: { followerId: req.user.id, followingId: followingId },
    });
    if (!follow_db) {
      return next(new CustomError("Error unfollowing user!", false, 401));
    }

    await follow_db.destroy();
    res.json({
      success: true,
      message: "User Unfollowed!",
    });
  }),

  // remove follower
  removeFollower: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;

    if (followerId == req.user.id) {
      return next(new CustomError("Cant remove yourself!", false, 401));
    }
    let follow_db = await Follow.findOne({
      where: { followerId: followerId, followingId: req.user.id },
    });
    if (!follow_db) {
      return next(new CustomError("Error removing follower!", false, 401));
    }

    await follow_db.destroy();
    res.json({
      success: true,
      message: "Follower removed!",
    });
  }),
  // get followers of a user
  getFollowers: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const followers = await User.findAll({
      include: {
        model: Follow,
        as: "followings",
        where: { followingId: userId, status: "accepted" },
        attributes: [],
      },
      attributes: ["id", "username", "profileImage"],
    });
    console.log(followers);
    res.json({ success: true, data: followers, message: "" });
  }),
  // get user followed by a user
  getFollowing: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const followings = await User.findAll({
      include: {
        model: Follow,
        as: "followers",
        where: { followerId: userId, status: "accepted" },
        attributes: [],
      },
      attributes: ["id", "username", "profileImage"],
    });
    console.log(followings);
    res.json({ success: true, data: followings, message: "" });
  }),
};
module.exports = followController;
