const express = require("express");
const router = express.Router();
const authctrl = require("../controllers/userController");
const { errorHandler } = require("../middleware/errorMiddleware");

router.post("/", (req, res) => res.status(200).json({ msg: "Follow route" }));

router.get("/follow", authctrl.follow);

module.exports = router;
