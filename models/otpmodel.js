"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class otpmodel extends Model {}
  otpmodel.init(
    {
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
  return otpmodel;
};
