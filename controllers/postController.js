const CustomError = require("../helpers/customError");
const {
  getUserDataFromToken,
  createAccessToken,
} = require("../helpers/auth/authutils");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
// const cloudinary = require("cloudinary").v2;
const cloudinary = require("../config/cloudinary");
const { User, Post, Like } = require("../models");

const postController = {
  // get user data
  uploadPost: asyncHandler(async (req, res, next) => {
    const { userId } = req.user.id;
    let postData = req.body.postdata;

    // parse content into json
    postData = JSON.parse(postData);
    console.log(postData);

    // make promise for upload image to cloudinary one by one
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, (error, result) => {
          if (error) {
            reject(error);
          } else {
            console.log("image upload", result.secure_url);

            // Remove the file from the server  after uploading
            fs.unlinkSync(file.path);
            resolve(result.secure_url);
          }
        });
      });
    });
    // get url be executing promisses
    const mediaUrls = await Promise.all(uploadPromises);

    // create new post row
    const newPost = await Post.create({
      userId: req.user.id,
      content: postData.content,
      media: mediaUrls,
    });

    res
      .status(201)
      .json({ success: true, data: newPost, msg: "Post uploaded" });
  }),

  // get single post
  getPost: asyncHandler(async (req, res, next) => {
    if (!req.params.postid) {
      if (!post) return next(new CustomError("Post not found!", false, 400));
    }
    const post = await Post.findByPk(req.params.postid);
    if (!post) return next(new CustomError("Post not found!", false, 400));
    const likes = await Like.count({
      where: { userId: req.user.id, postId: post.id },
    });
    const postData = post.toJSON();
    postData.likes = likes;
    res.status(201).json({ success: true, data: postData, msg: "success" });
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
      .json({ success: true, data: "", msg: "Post deleted successfully" });
  }),
  likePost: asyncHandler(async (req, res, next) => {
    const like = await Like.create({
      userId: req.user.id,
      postId: req.body.postId,
    });
    res.status(201).json({ success: true, data: "", msg: "Liked post" });
  }),
  unlikePost: asyncHandler(async (req, res, next) => {
    const like_db = await Like.findOne({
      where: { userId: req.user.id, postId: req.body.postId },
    });

    if (like_db) {
      await like_db.destroy();
      res
        .status(201)
        .json({ success: true, data: "", msg: "Post unliked successfully" });
    } else {
      return next(new CustomError("Like not found", false, 404));
    }
  }),
};
module.exports = postController;
