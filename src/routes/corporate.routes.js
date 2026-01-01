const express = require("express");
const {
  createCorporate,
  corporatesFilter,
  getAllCorporates,
  getCorporateById,
  updateCorporate,
  deleteCorporate,
} = require("../controllers/corporate.controller.js");
const {
  createCorporateValidation,
  getCorporateValidation,
  updateCorporateValidation,
} = require("../validation/corporate.validation.js");

const {
  checkAuthentication,
  searchMiddelware,
  sortMiddelware,
} = require("../../main/index.js");

const corporateRouter = express.Router();
corporateRouter
  .route("/")
  .post(checkAuthentication, createCorporateValidation, createCorporate)
  .get(
    checkAuthentication,
    corporatesFilter,
    searchMiddelware,
    sortMiddelware,
    getAllCorporates
  );
corporateRouter
  .route("/:id")
  .get(checkAuthentication, getCorporateValidation, getCorporateById)
  .put(checkAuthentication, updateCorporateValidation, updateCorporate)
  .delete(checkAuthentication, getCorporateValidation, deleteCorporate);

module.exports = corporateRouter;
