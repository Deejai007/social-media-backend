"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      // Company.hasMany(models.User, { as: "employees" });
      Company.hasMany(models.User, {
        foreignKey: "companyId",
        as: "employees",
      });
    }
  }
  Company.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
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
      hooks: {
        beforeValidate: (company) => {
          if (!company.slug) {
            company.slug = generateSlug(company.name);
          }
        },
      },
    }
  );
  function generateSlug(name) {
    return name
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
  return Company;
};
