const express = require("express");
const router = express.Router();
const companyctrl = require("../controllers/companyController");
const { errorHandler } = require("../middleware/errorMiddleware");

router.get("/", (req, res) => res.status(200).json({ msg: "Company" }));

router.post("/test", companyctrl.test);
router.post("/addCompany", companyctrl.addCompany);

module.exports = router;
