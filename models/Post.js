"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: "user_id" });
      // Post.belongsTo(models.User, { foreignKey: "id" });
      // experience.belongsTo(models.Company, { foreignKey: "companyId" });
    }
  }
  Post.init(
    {
      content: {
        type: DataTypes.STRING,
        allowNull: true,
        trim: true,
      },
      media: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      post_id: {
        primaryKey: true,
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
    }
  );
  return Post;
};
