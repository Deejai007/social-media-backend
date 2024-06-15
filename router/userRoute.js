const express = require("express");
const router = express.Router();
const authctrl = require("../controllers/userController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");
router.get("/", (req, res) => res.status(200).json({ msg: "User route" }));

router.get("/getUser", getAccessToRoute, authctrl.getUser);

//  router.post("/test", authctrl.test);
// Route for user registration
router.post("/register", authctrl.register);
router.post("/verify", authctrl.verify);
router.post("/verify/sendotp", authctrl.sendotp);
router.post("/login", authctrl.login);

router.post("/forgotsendotp", authctrl.forgotsendotp);
// router.post("/forgot/verify", authctrl.forgotverify);
// router.post("/forgot/reset", authctrl.resetpass);
// combined into below
router.post("/forgotresetpassword", authctrl.forgotresetPassword);
module.exports = router;
