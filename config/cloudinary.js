const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_cloudname,
  api_key: process.env.cloudinary_apikey,
  api_secret: process.env.cloudinary_apisecret,
});

module.exports = cloudinary;
