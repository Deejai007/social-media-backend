"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: "userId", as: "post" });
      Post.hasMany(models.Like, {
        foreignKey: "postId",
        as: "likes",
        onDelete: "CASCADE", //to delete associated likes if post is deleted
      });
    }
  }
  Post.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
        trim: true,
      },
      media: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // false = public, true = private
      },
    },
    {
      sequelize,
    }
  );
  return Post;
};
