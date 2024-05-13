"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class company extends Model {
    static associate(models) {
      company.hasMany(models.User, { as: "employees" });
    }
  }
  company.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true,
      },
      about: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tagline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
    }
  );
  return company;
};
