"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      tpin: {
        type: DataTypes.INTEGER,
        validate: { isInt: true, len: [4, 4] },
      },
      balance: {
        type: DataTypes.DECIMAL,
        defaultValue: 0.0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};
