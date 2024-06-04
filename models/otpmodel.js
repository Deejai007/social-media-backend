"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OtpModel extends Model {
    static associate(models) {
      // Company.hasMany(models.User, { as: "employees" });
      OtpModel.belongsTo(models.User, {
        foreignKey: "id",
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
      email: {
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
        // validate: { len: [4, 4] },
      },
    },
    {
      sequelize,
    }
  );
  return OtpModel;
};
