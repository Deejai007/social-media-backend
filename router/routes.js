const express = require("express");
const router = express.Router();

const user = require("./user");
const company = require("./company");

router.use("/user", user);
router.use("/company", company);

module.exports = router;
