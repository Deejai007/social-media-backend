"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: "userId",
        as: "recipient",
        onDelete: "CASCADE",
      });
      Notification.belongsTo(models.User, {
        foreignKey: "actorId",
        as: "actor",
        onDelete: "CASCADE",
      });
      Notification.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "post",
        onDelete: "CASCADE",
      });
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("new_follower", "post_like"),
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Notification",
    },
  );

  return Notification;
};
