"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Experience extends Model {
    static associate(models) {
      Experience.belongsTo(models.User, { foreignKey: "id" });
      // experience.belongsTo(models.Company, { foreignKey: "companyId" });
    }
  }
  Experience.init(
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
  return Experience;
};
