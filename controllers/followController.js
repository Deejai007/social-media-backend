const CustomError = require("../helpers/customError");
const { sequelize } = require("../models/index");
const asyncHandler = require("express-async-handler");
const { User, Follow } = require("../models");
require("dotenv").config();

const followController = {
  // Send follow request
  sendFollowReq: asyncHandler(async (req, res, next) => {
    const { followingId } = req.body;
    if (followingId == req.user.id) {
      return next(new CustomError("Can't follow yourself!", false, 401));
    }
    const existingFollow = await Follow.findOne({
      where: { followerId: req.user.id, followingId: followingId },
    });
    if (existingFollow) {
      return next(
        new CustomError("Follow request already pending", false, 401)
      );
    }
    const follow = await Follow.create({
      followerId: req.user.id,
      followingId: followingId,
      status: "pending",
    });
    res.json({
      success: true,
      message: "Follow request sent!",
      data: follow,
    });
  }),

  // Accept follow request
  acceptFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;
    console.log(followerId, req.user.id);
    if (followerId == req.user.id) {
      return next(new CustomError("Can't follow yourself!", false, 401));
    }
    const t = await sequelize.transaction();
    try {
      const follow = await Follow.findOne({
        where: { followerId: followerId, followingId: req.user.id },
        transaction: t,
      });
      if (!follow) {
        await t.rollback();
        return next(
          new CustomError("No pending follow request found", false, 401)
        );
      }
      await User.update(
        { followerCount: sequelize.literal("followerCount + 1") },
        { where: { id: req.user.id }, transaction: t }
      );
      await User.update(
        { followingCount: sequelize.literal("followingCount + 1") },
        { where: { id: followerId }, transaction: t }
      );
      follow.status = "accepted";
      await follow.save({ transaction: t });
      await t.commit();
      res.json({
        success: true,
        message: "Follow request accepted",
        data: follow,
      });
    } catch (error) {
      console.log(error);
      await t.rollback();
      return next(
        new CustomError("Error accepting follow request", false, 500)
      );
    }
  }),

  // Reject follow request
  rejectFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;
    if (followerId == req.user.id) {
      return next(new CustomError("Can't follow yourself!", false, 401));
    }
    const follow = await Follow.findOne({
      where: { followerId: followerId, followingId: req.user.id },
    });
    if (!follow) {
      return next(
        new CustomError("No pending follow request found", false, 401)
      );
    }
    await follow.destroy();
    res.json({
      success: true,
      message: "Follow request rejected",
      data: {},
    });
  }),

  // Get all pending follow requests
  getPendingRequests: asyncHandler(async (req, res, next) => {
    const pendingRequests = await Follow.findAll({
      where: { followingId: req.user.id, status: "pending" },
      include: [
        {
          model: User,
          as: "followers",
          attributes: ["id", "username", "profileImage"],
        },
      ],
      attributes: [],
      raw: true,
      order: [["createdAt", "DESC"]],
    });
    const formattedRequests = pendingRequests.map((request) => ({
      followerId: request["followers.id"],
      followerUsername: request["followers.username"],
      followerProfileImage: request["followers.profileImage"],
    }));
    res.json({
      success: true,
      message: "",
      data: formattedRequests,
    });
  }),

  // Unfollow user or remove follow request
  unfollowUser: asyncHandler(async (req, res, next) => {
    const { followingId, mode } = req.body.userData;
    console.log(req.body);
    if (!followingId) {
      return next(new CustomError("'followingId' is required", false, 400));
    }
    if (followingId == req.user.id) {
      return next(new CustomError("Can't unfollow yourself!", false, 401));
    }
    const t = await sequelize.transaction();
    try {
      const follow = await Follow.findOne({
        where: { followerId: req.user.id, followingId: followingId },
        transaction: t,
      });
      if (!follow) {
        await t.rollback();
        return next(
          new CustomError("No follow relationship found", false, 401)
        );
      }
      if (mode === "unfollow") {
        await User.update(
          { followerCount: sequelize.literal("followerCount - 1") },
          { where: { id: followingId }, transaction: t }
        );
        await User.update(
          { followingCount: sequelize.literal("followingCount - 1") },
          { where: { id: req.user.id }, transaction: t }
        );
      } else if (mode === "reqUnfollow") {
        await User.update(
          { followingCount: sequelize.literal("followingCount - 1") },
          { where: { id: req.user.id }, transaction: t }
        );
        await User.update(
          { followerCount: sequelize.literal("followerCount - 1") },
          { where: { id: followingId }, transaction: t }
        );
      }
      await follow.destroy({ transaction: t });
      await t.commit();
      res.json({
        success: true,
        message: "Unfollowed user or removed follow request",
        data: {},
      });
    } catch (error) {
      await t.rollback();
      // console.log(error);
      return next(new CustomError("Error unfollowing user", false, 500, error));
    }
  }),

  // Remove follower
  removeFollower: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;
    if (followerId == req.user.id) {
      return next(new CustomError("Can't remove yourself!", false, 401));
    }
    const t = await sequelize.transaction();
    try {
      const follow = await Follow.findOne({
        where: { followerId: followerId, followingId: req.user.id },
        transaction: t,
      });
      if (!follow) {
        await t.rollback();
        return next(new CustomError("No follower found", false, 401));
      }
      await User.update(
        { followerCount: sequelize.literal("followerCount - 1") },
        { where: { id: req.user.id }, transaction: t }
      );
      await User.update(
        { followingCount: sequelize.literal("followingCount - 1") },
        { where: { id: followerId }, transaction: t }
      );
      await follow.destroy({ transaction: t });
      await t.commit();
      res.json({
        success: true,
        message: "Follower removed",
        data: {},
      });
    } catch (error) {
      await t.rollback();
      return next(new CustomError("Error removing follower", false, 500));
    }
  }),

  // Get followers of a user
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
    res.json({
      success: true,
      message: "",
      data: followers,
    });
  }),

  // Get users that the current user is following
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
    res.json({
      success: true,
      message: "",
      data: followings,
    });
  }),
};

module.exports = followController;
