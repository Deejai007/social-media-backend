const CustomError = require("../helpers/customError");
const {
  getUserDataFromToken,
  createAccessToken,
} = require("../helpers/auth/authutils");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
// const cloudinary = require("cloudinary").v2;
const cloudinary = require("../config/cloudinary");
const User = require("../models").User;
const Post = require("../models").Post;

const postController = {
  // get user data
  postUpload: asyncHandler(async (req, res, next) => {
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

            // Remove the file from the server after uploading
            fs.unlinkSync(file.path);
            resolve(result.secure_url);
          }
        });
      });
    });
    // get url be executing promisses
    const mediaUrls = await Promise.all(uploadPromises);

    // create post row in Post table
    const newPost = await Post.create({
      userId: req.user.id,
      content: postData.content,
      media: mediaUrls,
    });

    res
      .status(201)
      .json({ success: true, data: newPost, msg: "Post uploaded" });
  }),
};
module.exports = postController;
