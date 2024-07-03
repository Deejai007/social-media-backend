// authUtils.js

const jwt = require("jsonwebtoken");

const secretKey = process.env.ACCESS_TOKEN_SECRET;

// create access token
function createAccessToken(userData) {
  return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1w",
  });
}

//  decode access token
function getUserDataFromToken(token) {
  try {
    if (!token) {
      console.error("Authorization header is missing");
      return null;
    }

    const decoded = jwt.verify(token, secretKey);
    return decoded; // decoded contains user data
  } catch (err) {
    console.error("Token validation failed:", err);
    return null;
  }
}

module.exports = {
  getUserDataFromToken,
  createAccessToken,
};
