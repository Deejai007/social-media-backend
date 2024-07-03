const express = require("express");
const router = express.Router();
const authctrl = require("../controllers/userController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");
const { body } = require("express-validator");

const registerValidator = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password")
    .isLength({ min: 5, max: 20 })
    .withMessage("Password must be between 6 and 100 characters"),
];
const verifyValidator = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("Invalid OTP!"),
];
const loginValidator = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password")
    .isLength({ min: 5, max: 100 })
    .withMessage("Password must be between 6 and 100 characters"),
];
const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Enter a valid email"),
];
const forgotResetPasswordValidator = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("newPassword")
    .isLength({ min: 5, max: 100 })
    .withMessage("Password must be between 6 and 100 characters"),
];

router.get("/", (req, res) => res.status(200).json({ message: "User route" }));

router.get("/getUser", getAccessToRoute, authctrl.getUser);

//  router.post("/test", authctrl.test);
router.post("/register", registerValidator, authctrl.register);

router.post("/verify", verifyValidator, authctrl.verify);
router.post("/verifysendotp", authctrl.sendotp);
router.post("/login", loginValidator, authctrl.login);

router.post(
  "/forgotpassword",
  forgotPasswordValidator,
  authctrl.forgotpassword
);
// router.post("/forgot/verify", authctrl.forgotverify);
// router.post("/forgot/reset", authctrl.resetpass);
// combined into below
router.post("/forgotresetpassword/:token", authctrl.forgotresetPassword);
module.exports = router;
