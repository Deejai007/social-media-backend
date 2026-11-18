const express = require("express");
const router = express.Router();

const userRoute = require("./userRoute");
const followRoute = require("./followRoute");
const postRoute = require("./postRoute");
const notificationRoute = require("./notificationRoute");

router.use("/user", userRoute);
router.use("/follow", followRoute);
router.use("/post", postRoute);
router.use("/notifications", notificationRoute);

module.exports = router;
