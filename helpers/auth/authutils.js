// authUtils.js

const jwt = require("jsonwebtoken");

const secretKey = process.env.ACCESS_TOKEN_SECRET;

function getUserDataFromToken(authorizationHeader) {
  try {
    if (!authorizationHeader) {
      console.error("Authorization header is missing");
      return null;
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      console.error("Token is missing in Authorization header");
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
};
