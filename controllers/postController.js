const CustomError = require("../helpers/customError");

const asyncHandler = require("express-async-handler");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const { User, Post, Like } = require("../models");

const postController = {
  // get user data
  uploadPost: asyncHandler(async (req, res, next) => {
    const { userId } = req.user.id;
    let formData = req.body;

    // parse content into json

    console.log(formData);
    const imageFile = req.files[0];

    // let postData = JSON.parse(postData);
    // console.log(postData);
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imageFile.path, (error, result) => {
        if (error) {
          reject(error);
        } else {
          console.log("Image uploaded:", result.secure_url);

          // Remove the file from the server after uploading
          fs.unlinkSync(imageFile.path);
          resolve(result.secure_url);
        }
      });
    });
    console.log(result);
    const mediaUrl = result;

    // create new post row
    const newPost = await Post.create({
      userId: req.user.id,
      caption: formData.caption,
      location: formData.location,
      media: mediaUrl,
    });

    res
      .status(201)
      .json({ success: true, postId: newPost.id, message: "Post uploaded" });
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
        attributes: ["username", "profileImage"],
      },
    });
    if (!post) return next(new CustomError("Post not found!", false, 400));
    // const likes = await Like.count({
    //   where: { userId: req.user.id, postId: post.id },
    // });
    let isLikedByUser = await Like.count({
      where: { userId: req.user.id, postId: post.id },
    });
    const postData = post.toJSON();
    // postData.likes = likes;
    postData.username = postData.post.username;
    postData.profileImage = postData.post.profileImage;
    postData.isLikedByUser = isLikedByUser;
    console.log(postData);
    res.status(201).json({ success: true, data: postData, message: "success" });
  }),

  // get user posts
  getPosts: asyncHandler(async (req, res, next) => {
    console.log(req.params.postId);
    const userId = req.params.userId;
    if (!userId) {
      return next(new CustomError("Error fetching posts!", false, 400));
    }
    const limit = parseInt(req.query.limit) || 9;
    const offset = parseInt(req.query.offset) || 0;

    let posts = await Post.findAll({
      where: { userId: userId },
      // attributes: [], // dont include any attributes of the model instance
      raw: true, //dont return instance of the model just return raw db object
      order: [["createdAt", "DESC"]], // get latest at top
      offset: offset,
      limit: limit,
    });

    console.log(posts);
    // postData.likes = likes;
    res.status(201).json({ success: true, data: posts, message: "success" });
  }),

  // delete post
  deletePost: asyncHandler(async (req, res, next) => {
    const { postid } = req.params;
    // console.log(postId);
    // console.log(req.params.postid);

    const post = await Post.findByPk(postid);
    if (!post) {
      return next(new CustomError("Post not found", false, 404));
    }
    if (post.userId !== req.user.id) {
      return next(
        new CustomError("Unauthorized to delete this post", false, 403)
      );
    }
    await post.destroy();
    res
      .status(200)
      .json({ success: true, data: "", message: "Post deleted successfully" });
  }),
  //like post
  likePost: asyncHandler(async (req, res, next) => {
    // console.log(req.user.id);
    console.log(req.body);
    const { postId } = req.body;
    console.log(postId);
    const likechk = await Like.count({
      where: { userId: req.user.id, postId: req.body.postId },
    });
    console.log(likechk);
    if (likechk) {
      res
        .status(201)
        .json({ success: false, data: "", message: "Already Liked post " });
      return;
    }

    const like = await Like.create({
      userId: req.user.id,
      postId: req.body.postId,
    });
    await Post.increment("likeCount", { by: 1, where: { id: postId } });
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
