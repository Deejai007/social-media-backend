const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate(models) {
      Follow.belongsTo(models.User, {
        foreignKey: "followerId",
        as: "followers",
      });
      Follow.belongsTo(models.User, {
        foreignKey: "followingId",
        as: "followings",
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
