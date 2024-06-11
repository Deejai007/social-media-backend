const express = require("express");
const router = express.Router();
const followctrl = require("../controllers/followController");
const { errorHandler } = require("../middleware/errorMiddleware");
const { getAccessToRoute } = require("../middleware/auth");

router.post("/", (req, res) => res.status(200).json({ msg: "Follow route" }));

router.post("/sendreq", getAccessToRoute, followctrl.sendFollowReq);
router.post("/acceptreq", getAccessToRoute, followctrl.acceptFollowReq);
router.post("/rejectreq", getAccessToRoute, followctrl.rejectFollowReq);
router.get(
  "/get-pending-requests",
  getAccessToRoute,
  followctrl.getPendingRequests
);

module.exports = router;
