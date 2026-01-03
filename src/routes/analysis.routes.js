const express = require("express");
const {
  checkAuthentication,
  checkAdminEmail,
  getUidByEmail,
  chackAdminDispatch,
  chackAdminAdmin,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index.js");
const {
  getDashboardAnalysis,
  getDriverAnalysis,
  sendEarningsEmail,
  genralAnalysis,
  getDashboardRides,
  getDashboardDriverEarnings,
  getDashboardYearlyData,
  getDashboardRevenue,
} = require("../controllers/analysis.controller.js");

const analysisRouter = express.Router();
analysisRouter.route("/getDashboardYearlyData").post(getDashboardYearlyData);
analysisRouter.route("/getDashboardRides").post(getDashboardRides);
analysisRouter.route("/getDashboardRevenue").post(getDashboardRevenue);
analysisRouter
  .route("/getDashboardDriverEarnings")
  .post(getDashboardDriverEarnings);
analysisRouter.route("/earningsEmail").put(sendEarningsEmail);

module.exports = analysisRouter;
