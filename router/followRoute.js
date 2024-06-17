const express = require("express");
const router = express.Router();
const followctrl = require("../controllers/followController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");

router.post("/", (req, res) => res.status(200).json({ msg: "Follow route" }));

router.post("/sendreq", getAccessToRoute, followctrl.sendFollowReq);
router.post("/acceptreq", getAccessToRoute, followctrl.acceptFollowReq);
router.post("/rejectreq", getAccessToRoute, followctrl.rejectFollowReq);
router.post("/unfollow-user", getAccessToRoute, followctrl.unfollowUser);
router.post("/remove-follower", getAccessToRoute, followctrl.removeFollower);
router.get(
  "/get-pending-requests",
  getAccessToRoute,
  followctrl.getPendingRequests
);
router.get("/followers", getAccessToRoute, followctrl.getFollowers);
router.get("/followings", getAccessToRoute, followctrl.getFollowing);
module.exports = router;
