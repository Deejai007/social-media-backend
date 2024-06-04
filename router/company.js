const express = require("express");
const router = express.Router();
const companyctrl = require("../controllers/companyController");
const { errorHandler } = require("../middleware/errorMiddleware");

router.get("/", (req, res) => res.status(200).json({ msg: "Company" }));

router.get("/getCompany/:id", companyctrl.getCompany);
router.post("/addCompany", companyctrl.addCompany);
router.delete("/deleteCompany/:id", companyctrl.deleteCompany);
router.put("/updateCompany/:id", companyctrl.updateCompany);

module.exports = router;
