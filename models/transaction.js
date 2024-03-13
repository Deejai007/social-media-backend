"use strict";
const { Model } = require("sequelize");
const User = require("../models/user");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.User, {
        as: "Sender",
        foreignKey: "id",
      });
      Transaction.belongsTo(models.User, {
        as: "Receiver",
        foreignKey: "id",
      });
    }
  }
  Transaction.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      byAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      senderId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
