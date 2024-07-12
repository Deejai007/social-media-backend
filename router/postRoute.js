const express = require("express");
const router = express.Router();
const postctrl = require("../controllers/postController");
// const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");
const upload = require("../config/multerconfig");
router.get("/", (req, res) => res.status(200).json({ message: "post route" }));

router.get("/get-post/:postId", getAccessToRoute, postctrl.getSinglePost);

router.get("/get-posts", getAccessToRoute, postctrl.getPosts);
router.post(
  "/upload-post",
  getAccessToRoute,
  upload.array("image", 10),
  postctrl.uploadPost
);
router.delete("/delete-post/:postid", getAccessToRoute, postctrl.deletePost);

router.post("/like-post", getAccessToRoute, postctrl.likePost);
router.post("/unlike-post", getAccessToRoute, postctrl.unlikePost);

module.exports = router;
