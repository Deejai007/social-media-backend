"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.OtpModel, {
        foreignKey: "id",
      });
      User.hasMany(models.Follow, {
        foreignKey: "followerId",
        as: "followers",
      });
      User.hasMany(models.Follow, {
        foreignKey: "followingId",
        as: "followings",
      });
      User.hasMany(models.Post, { foreignKey: "userId", as: "posts" });
      User.hasMany(models.Like, { foreignKey: "userId", as: "likes" });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: { type: DataTypes.STRING, unique: true, allowNull: true },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profileImage: {
        type: DataTypes.STRING,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      about: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
