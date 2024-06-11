"use strict";
const { Model } = require("sequelize");
const User = require("./User");
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate(models) {
      Follow.belongsTo(models.User, {
        foreignKey: "followerId",
        as: "follower",
      });
      Follow.belongsTo(models.User, {
        foreignKey: "followingId",
        as: "following",
      });
    }
  }
  Follow.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      followingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted"),
        defaultValue: "pending",
      },
    },
    {
      sequelize,
    }
  );
  return Follow;
};
