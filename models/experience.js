"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class experience extends Model {
    static associate(models) {
      experience.belongsTo(models.User, { foreignKey: "id" });
      // experience.belongsTo(models.Company, { foreignKey: "companyId" });
    }
  }
  experience.init(
    {
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        trim: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
    }
  );
  return experience;
};
