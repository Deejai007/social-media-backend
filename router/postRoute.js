const express = require("express");
const router = express.Router();
const postctrl = require("../controllers/postController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");
const upload = require("../config/multerconfig");
router.get("/", (req, res) => res.status(200).json({ msg: "post route" }));

router.post(
  "/post-upload",
  getAccessToRoute,
  upload.array("hello", 10),
  postctrl.postUpload
);

module.exports = router;
