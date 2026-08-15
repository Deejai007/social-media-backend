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
  const vibeOptions = [
    { emoji: "😎", label: "Vibin’" },
    { emoji: "🥳", label: "Lit" },
    { emoji: "😡", label: "Mad AF" },
    { emoji: "😢", label: "Lowkey Down" },
    { emoji: "🤡", label: "Clownin’" },
    { emoji: "🚀", label: "Amped" },
    { emoji: "😴", label: "Dead" },
    { emoji: "🤔", label: "Bruh / What?!" },
    { emoji: "🫨", label: "High up there" },
  ];

  // For ENUM, use only the labels
  const vibeLabels = vibeOptions.map((v) => v.label);

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
      vibeType: {
        type: DataTypes.ENUM(...vibeLabels),
        allowNull: true,
      },
    },
    {
      sequelize,
    }
  );

  // Export vibeOptions for use elsewhere if needed
  Post.vibeOptions = vibeOptions;
  return Post;
};
