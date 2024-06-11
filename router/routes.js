const express = require("express");
const router = express.Router();

const userRoute = require("./userRoute");
const followRoute = require("./followRoute");

// const company = require("./company");

router.use("/user", userRoute);
router.use("/follow", followRoute);
// router.use("/company", company);

module.exports = router;
