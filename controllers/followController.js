const CustomError = require("../helpers/customError");
const { sequelize } = require("../models/index");
const asyncHandler = require("express-async-handler");
const { User, Follow } = require("../models");
require("dotenv").config();

const followController = {
  // follow user - send request
  sendFollowReq: asyncHandler(async (req, res, next) => {
    const { followingId } = req.body;
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

    res.on("finish", () => {
      console.log(
        `Follow request sent by user ${req.user.id} to user ${followingId}`
      );
    });
  }),

  // accept follow request
  acceptFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;

    if (followerId == req.user.id) {
      return next(new CustomError("Can't follow yourself!", false, 401));
    }

    const t = await sequelize.transaction(); // Start a transaction

    try {
      let follow_db = await Follow.findOne({
        where: { followerId: followerId, followingId: req.user.id },
        transaction: t, // Use the transaction
      });

      if (!follow_db) {
        await t.rollback(); // Rollback transaction if not found
        return next(new CustomError("Error accepting request.", false, 401));
      }
      const user1_db = await User.findOne({
        where: { id: followerId },
        transaction: t,
      });
      const user2_db = await User.findOne({
        where: { id: req.user.id },
        transaction: t,
      });

      if (!user1_db || !user2_db) {
        await t.rollback();
        return next(new CustomError("Error accepting request.", false, 401));
      }

      await user1_db.increment({ followingCount: 1 }, { transaction: t });
      await user2_db.increment({ followerCount: 1 }, { transaction: t });

      follow_db.status = "accepted";
      await follow_db.save({ transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: "Follow request accepted",
        data: follow_db,
      });
    } catch (error) {
      await t.rollback();
      console.error(error);
      return next(new CustomError("Error accepting request.", false, 500));
    }

    res.on("finish", () => {
      console.log(
        `Follow request accepted by user ${req.user.id} from user ${followerId}`
      );
    });
  }),

  // follow user - decline request
  rejectFollowReq: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;

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

    res.on("finish", () => {
      console.log(
        `Follow request rejected by user ${req.user.id} from user ${followerId}`
      );
    });
  }),

  // get all pending requests
  getPendingRequests: asyncHandler(async (req, res, next) => {
    let pendingRequests = await Follow.findAll({
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
    pendingRequests = pendingRequests.map((data) => ({
      followerId:
        data["followers.id"] !== null ? data["followers.id"].toString() : null,
      followerProfileImage: data["followers.profileImage"],
      followerUsername: data["followers.username"],
    }));
    res.json({ success: true, message: "", data: pendingRequests });

    res.on("finish", () => {
      console.log(`Pending requests fetched for user ${req.user.id}`);
    });
  }),

  // unfollow user: handles both unfollowing and remove follow request sent to some user
  unfollowUser: asyncHandler(async (req, res, next) => {
    const { userData } = req.body;
    const { followingId, mode } = userData;
    console.log(mode);

    if (followingId == req.user.id) {
      return next(new CustomError("Can't unfollow yourself!", false, 401));
    }
    const t = await sequelize.transaction();

    try {
      let follow_db = await Follow.findOne({
        where: { followerId: req.user.id, followingId: followingId },
        transaction: t,
      });
      console.log(follow_db.status);

      if (!follow_db) {
        await t.rollback();
        return next(new CustomError("Error unfollowing user!", false, 401));
      }

      const user1_db = await User.findOne({
        where: { id: req.user.id },
        transaction: t,
      });
      const user2_db = await User.findOne({
        where: { id: followingId },
        transaction: t,
      });

      if (!user1_db || !user2_db) {
        await t.rollback();
        return next(new CustomError("Error unfollowing user!", false, 401));
      }
      if (mode == "reqUnfollow") {
        await user1_db.decrement({ followingCount: 1 }, { transaction: t });
        await user2_db.decrement({ followerCount: 1 }, { transaction: t });
      }

      await follow_db.destroy({ transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: "User Unfollowed!",
      });
    } catch (error) {
      await t.rollback();
      console.error(error);
      return next(new CustomError("Error unfollowing user.", false, 500));
    }

    res.on("finish", () => {
      console.log(`User ${req.user.id} unfollowed user ${followingId}`);
    });
  }),

  // remove follower
  removeFollower: asyncHandler(async (req, res, next) => {
    const { followerId } = req.body;

    if (followerId == req.user.id) {
      return next(new CustomError("Can't remove yourself!", false, 401));
    }

    const t = await sequelize.transaction();

    try {
      let follow_db = await Follow.findOne({
        where: { followerId: followerId, followingId: req.user.id },
        transaction: t,
      });

      if (!follow_db) {
        await t.rollback();
        return next(new CustomError("Error removing follower!", false, 401));
      }

      const user1_db = await User.findOne({
        where: { id: followerId },
        transaction: t,
      });
      const user2_db = await User.findOne({
        where: { id: req.user.id },
        transaction: t,
      });

      if (!user1_db || !user2_db) {
        await t.rollback();
        return next(new CustomError("Error removing follower.", false, 401));
      }

      await user1_db.decrement({ followingCount: 1 }, { transaction: t });
      await user2_db.decrement({ followerCount: 1 }, { transaction: t });

      await follow_db.destroy({ transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: "Follower removed!",
      });
    } catch (error) {
      await t.rollback();
      console.error(error);
      return next(new CustomError("Error removing follower.", false, 500));
    }

    res.on("finish", () => {
      console.log(`Follower ${followerId} removed by user ${req.user.id}`);
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
    res.json({ success: true, data: followers, message: "" });

    res.on("finish", () => {
      console.log(`Followers fetched for user ${userId}`);
    });
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
    res.json({ success: true, data: followings, message: "" });

    res.on("finish", () => {
      console.log(`Following list fetched for user ${userId}`);
    });
  }),
};

module.exports = followController;
