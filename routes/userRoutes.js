const express = require("express");
const router = express.Router();
const authctrl = require("../controllers/userController");
// Route for user registration
router.post("/register", authctrl.register);
router.post("/verify", authctrl.verify);
router.post("/verify/sendotp", authctrl.sendotp);
router.post("/login", authctrl.login);

router.post("/forgot/send", authctrl.forgotsendotp);
router.post("/forgot/verify", authctrl.forgotverify);
router.post("/forgot/reset", authctrl.resetpass);
module.exports = router;
