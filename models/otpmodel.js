"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OtpModel extends Model {
    static associate(models) {
      OtpModel.belongsTo(models.User, {
        foreignKey: "userEmail",
        targetKey: "email",
        as: "user",
      });
    }
  }
  OtpModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      verify: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      otp: {
        type: DataTypes.STRING,
        // allowNull: false,
        validate: { len: [6, 6] },
      },
    },
    {
      sequelize,
    }
  );
  return OtpModel;
};
