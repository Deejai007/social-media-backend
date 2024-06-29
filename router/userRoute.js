const express = require("express");
const router = express.Router();
const authctrl = require("../controllers/userController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");
const { body } = require("express-validator");

router.get("/", (req, res) => res.status(200).json({ message: "User route" }));

router.get("/getUser", getAccessToRoute, authctrl.getUser);

//  router.post("/test", authctrl.test);
router.post("/register", registerValidator, authctrl.register);

router.post("/verify", authctrl.verify);
router.post("/verify/sendotp", authctrl.sendotp);
router.post("/login", loginValidator, authctrl.login);

router.post("/forgotsendotp", authctrl.forgotsendotp);
// router.post("/forgot/verify", authctrl.forgotverify);
// router.post("/forgot/reset", authctrl.resetpass);
// combined into below
router.post("/forgotresetpassword", authctrl.forgotresetPassword);
module.exports = router;

function registerValidator(req, res, next) {
  const validator = [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 5, max: 20 })
      .withMessage("Password must be between 6 and 100 characters"),
  ];
  validator(req, res, next);
}

function loginValidator(req, res, next) {
  const validator = [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 5, max: 100 })
      .withMessage("Password must be between 6 and 100 characters"),
  ];
  validator(req, res, next);
}
