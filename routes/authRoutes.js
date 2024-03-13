const express = require("express");
const authController = require("../controllers").authController;
const router = express.Router();

// Route for user registration
router.post("/register", authController.register);

// Route for user login
router.post("/login", (req, res) => {
  // Implement user login logic here
});

// Route for user logout
router.post("/logout", (req, res) => {
  // Implement user logout logic here
});

module.exports = router;
