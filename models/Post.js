"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      // Post.belongsTo(models.User, { foreignKey: "id" });
      // experience.belongsTo(models.Company, { foreignKey: "companyId" });
    }
  }
  Post.init(
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
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        trim: true,
      },
      media: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
    },
    {
      sequelize,
    }
  );
  return Post;
};
