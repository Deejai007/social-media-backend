const express = require("express");
const router = express.Router();
const { getAccessToRoute } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.get("/", getAccessToRoute, notificationController.getNotifications);
router.patch(
  "/:notificationId/read",
  getAccessToRoute,
  notificationController.markNotificationRead,
);

module.exports = router;
