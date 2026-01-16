const express = require("express");
const {
  checkAuthentication,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index");
const {
  createDiscountProgramValidation,
  updateDiscountProgramValidation,
} = require("../validation/discount_program.validation");
const {
  createDiscountProgram,
  updateDiscountProgram,
  getAllDiscountPrograms,
  enableDiscountProgram,
  deleteDiscountProgram,
  getDiscountProgramById,
  programFilter,
} = require("../controllers/discount_programs.controller");
const discountProgramRouter = express.Router();

discountProgramRouter
  .route("/")
  .post(
    checkAuthentication,
    createDiscountProgramValidation,
    createDiscountProgram
  )
  .get(
    checkAuthentication,
    searchMiddelware,
    sortMiddelware,
    programFilter,
    getAllDiscountPrograms
  );

discountProgramRouter
  .route("/:id")
  .put(
    checkAuthentication,
    updateDiscountProgramValidation,
    updateDiscountProgram
  )
  .patch(checkAuthentication, enableDiscountProgram)
  .delete(checkAuthentication, deleteDiscountProgram)
  .get(checkAuthentication, getDiscountProgramById);

module.exports = discountProgramRouter;
