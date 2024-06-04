const { check, validationResult } = require("express-validator");
const CustomError = require("../helpers/customError");
// const { errorHandler } = require("../middleware/errorMiddleware");
const asyncHandler = require("express-async-handler");
const Company = require("../models").Company;

require("dotenv").config();

const companyController = {
  // get company details
  getCompany: asyncHandler(async (req, res, next) => {
    const { company_id } = req.params.id;
    console.log(company_id);

    const company_db = await Company.findOne({ id: company_id });
    if (!company_db) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, data: company_db });
  }),

  // add new company
  addCompany: asyncHandler(async (req, res, next) => {
    console.log(req.body);

    const company_db = await Company.create(req.body);
    res.status(201).json({ success: true, data: company_db });
  }),

  // update company
  updateCompany: asyncHandler(async (req, res, next) => {
    const companyId = req.params.id;
    const updateData = req.body;

    const [updated] = await Company.update(updateData, {
      where: { id: companyId },
    });

    if (updated) {
      const updatedCompany = await Company.findByPk(companyId);
      res.json({
        message: "Company updated successfully",
        data: updatedCompany,
      });
    } else {
      return next(new CustomError("Error updating company data", false, 400));
    }
  }),

  // delete company
  deleteCompany: asyncHandler(async (req, res, next) => {
    const company_id = req.params.id;
    console.log(company_id);

    const company_db = await Company.findByPk(company_id);

    if (!company_db) {
      return next(new CustomError("Error deleting Company", false, 400));
    }
    await company_db.destroy();
    return res.status(200).json({ message: "Company deleted successfully" });
  }),
};
module.exports = companyController;
