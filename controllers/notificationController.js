const asyncHandler = require("express-async-handler");
const { Notification, User, Post } = require("../models");
const CustomError = require("../helpers/customError");

const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "username", "profileImage"],
        },
        {
          model: Post,
          as: "post",
          attributes: ["id", "media"],
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit: 50,
    });

    res.status(200).json({ success: true, data: notifications });
  }),

  markNotificationRead: asyncHandler(async (req, res, next) => {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: { id: req.params.notificationId, userId: req.user.id } },
    );
    if (!updatedCount) {
      return next(new CustomError("Notification not found", false, 404));
    }
    res
      .status(200)
      .json({ success: true, data: { id: req.params.notificationId } });
  }),
};

module.exports = notificationController;
