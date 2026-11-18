const CustomError = require("../helpers/customError");

const asyncHandler = require("express-async-handler");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const {
  User,
  Post,
  Like,
  Follow,
  Notification,
  sequelize,
} = require("../models");
const logger = require("../helpers/logger");
const { Op } = require("sequelize");

const postController = {
  // get user data
  uploadPost: asyncHandler(async (req, res, next) => {
    const formData = req.body;
    const imageFile = req.files?.[0];
    const caption =
      typeof formData.caption === "string" ? formData.caption : "";
    const hasValidVibe = Post.vibeOptions.some(
      ({ label }) => label === formData.vibe,
    );

    if (!hasValidVibe) {
      return next(new CustomError("Choose a valid vibe.", false, 400));
    }
    if (!imageFile && !caption.trim()) {
      return next(
        new CustomError("Add a photo or write something to share.", false, 400),
      );
    }

    let mediaUrl = null;
    if (imageFile) {
      mediaUrl = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(imageFile.path, (error, result) => {
          if (error) {
            reject(error);
          } else {
            fs.unlinkSync(imageFile.path);
            resolve(result.secure_url);
          }
        });
      });
    }

    const newPost = await Post.create({
      userId: req.user.id,
      caption,
      location: formData.location,
      media: mediaUrl,
      isPrivate: false,
      vibeType: formData.vibe,
    });

    // update streak
    const user = await User.findByPk(req.user.id);
    const today = new Date().toDateString();
    const lastDate = user.lastVibeDate
      ? new Date(user.lastVibeDate).toDateString()
      : null;
    logger.log({ today, lastDate, streak: user.streakCount });

    if (lastDate === today) {
      // already posted today, no change
    } else if (
      lastDate &&
      new Date(today) - new Date(lastDate) === 86400000 // 1 day apart
    ) {
      user.streakCount += 1;
      user.lastVibeDate = new Date();
    } else {
      // streak broken or first post
      user.streakCount = 1;
      user.lastVibeDate = new Date();
    }
    logger.log("New streak:", user.streakCount);
    await user.save();

    res.status(201).json({
      success: true,
      postId: newPost.id,
      message: "Post uploaded",
    });
  }),

  // get single post
  getSinglePost: asyncHandler(async (req, res, next) => {
    if (!req.params.postId) {
      if (!post) return next(new CustomError("Post not found!", false, 400));
    }
    const post = await Post.findOne({
      where: { id: req.params.postId },
      include: {
        model: User,
        as: "post",
        attributes: ["id", "username", "profileImage"],
      },
    });
    if (!post) return next(new CustomError("Post not found!", false, 400));

    // Check privacy: if private, only owner or followers can view
    if (post.isPrivate && req.user.id !== post.userId) {
      // Check if requester is a follower
      const { Follow } = require("../models");
      const follow = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: post.userId,
          status: "accepted",
        },
      });
      if (!follow) {
        return next(new CustomError("This post is private.", false, 403));
      }
    }

    let isLikedByUser = await Like.count({
      where: { userId: req.user.id, postId: post.id },
    });
    const postData = post.toJSON();
    postData.username = postData.post.username;
    postData.profileImage = postData.post.profileImage;
    postData.isLikedByUser = isLikedByUser;

    res.status(201).json({ success: true, data: postData, message: "success" });
  }),

  // get user posts
  getPosts: asyncHandler(async (req, res, next) => {
    const userId = req.params.userId;
    if (!userId) {
      return next(new CustomError("Error fetching posts!", false, 400));
    }
    const limit = parseInt(req.query.limit) || 9;
    const offset = parseInt(req.query.offset) || 0;

    // Only return public posts, or private posts if requester is owner or follower
    let whereClause = { userId: userId };
    if (req.user.id !== parseInt(userId)) {
      // Not the owner, so only show public or private if follower
      const { Follow } = require("../models");
      const isFollower = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: userId,
          status: "accepted",
        },
      });
      if (isFollower) {
        // Show both public and private
        // no change to whereClause
      } else {
        // Only show public
        whereClause.isPrivate = false;
      }
    }

    let posts = await Post.findAll({
      where: whereClause,
      raw: true,
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit,
    });

    res.status(201).json({ success: true, data: posts, message: "success" });
  }),

  // Get the authenticated user's chronological feed
  getFeed: asyncHandler(async (req, res) => {
    const viewerId = Number(req.user.id);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const requestedOffset = Number.parseInt(req.query.offset, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;
    const offset =
      Number.isInteger(requestedOffset) && requestedOffset > 0
        ? requestedOffset
        : 0;

    const acceptedFollowings = await Follow.findAll({
      attributes: ["followingId"],
      where: { followerId: viewerId, status: "accepted" },
      raw: true,
    });
    const authorIds = [
      ...new Set([
        viewerId,
        ...acceptedFollowings.map((follow) => follow.followingId),
      ]),
    ];

    const posts = await Post.findAll({
      where: { userId: { [Op.in]: authorIds } },
      include: [
        {
          model: User,
          as: "post",
          attributes: ["id", "username", "profileImage"],
        },
        {
          model: Like,
          as: "likes",
          attributes: ["id"],
          where: { userId: viewerId },
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      offset,
      limit: limit + 1,
    });

    const hasMore = posts.length > limit;
    const data = posts.slice(0, limit).map((post) => {
      const postData = post.toJSON();
      postData.username = postData.post.username;
      postData.profileImage = postData.post.profileImage;
      postData.isLikedByUser = postData.likes.length > 0;
      delete postData.post;
      delete postData.likes;
      return postData;
    });

    res.status(200).json({
      success: true,
      data,
      hasMore,
      message: "success",
    });
  }),

  // delete post
  deletePost: asyncHandler(async (req, res, next) => {
    const { postid } = req.params;

    const post = await Post.findByPk(postid);
    if (!post) {
      return next(new CustomError("Post not found", false, 404));
    }
    if (post.userId !== req.user.id) {
      return next(
        new CustomError("Unauthorized to delete this post", false, 403),
      );
    }
    await post.destroy();
    // await User.decrement("postCount", { by: 1, where: { id: req.user.id } });
    res
      .status(200)
      .json({ success: true, data: "", message: "Post deleted successfully" });
  }),
  //like post
  likePost: asyncHandler(async (req, res, next) => {
    const { postId } = req.body;
    const likechk = await Like.count({
      where: { userId: req.user.id, postId },
    });
    if (likechk) {
      res
        .status(201)
        .json({ success: false, data: "", message: "Already Liked post " });
      return;
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return next(new CustomError("Post not found", false, 404));
    }

    await sequelize.transaction(async (transaction) => {
      await Like.create(
        {
          userId: req.user.id,
          postId,
        },
        { transaction },
      );
      await Post.increment("likeCount", {
        by: 1,
        where: { id: postId },
        transaction,
      });
      if (post.userId !== req.user.id) {
        await Notification.create(
          {
            userId: post.userId,
            actorId: req.user.id,
            postId,
            type: "post_like",
          },
          { transaction },
        );
      }
    });
    res.status(201).json({ success: true, data: "", message: "Liked post" });
  }),
  //unlike post
  unlikePost: asyncHandler(async (req, res, next) => {
    const like_db = await Like.findOne({
      where: { userId: req.user.id, postId: req.body.postId },
    });

    if (like_db) {
      await like_db.destroy();
      await Post.decrement("likeCount", {
        by: 1,
        where: { id: req.body.postId },
      });
      res.status(201).json({
        success: true,
        data: "",
        message: "Post unliked successfully",
      });
    } else {
      return next(new CustomError("Like not found", false, 404));
    }
  }),
};
module.exports = postController;
