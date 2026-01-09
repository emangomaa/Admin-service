const express = require("express");
const {
  createDiscountRequest,
  updateDiscountRequest,
  getDiscountRequestById,
  getAllDiscountRequests,
  deleteDiscountRequest,
  approvedDiscountRequest,
  rejectDiscountRequest,
  enableDiscountRequest,
} = require("../controllers/discount_request.controller");

const {
  createDiscountRequestValidation,
  updateDiscountRequestValidation,
  deleteDiscountRequestValidation,
  getDiscountRequestValidation,
} = require("../validation/discount_request.validation");
const {
  checkAuthentication,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index");
const discountRequestRouter = express.Router();

discountRequestRouter
  .route("/")
  .post(
    checkAuthentication,
    createDiscountRequestValidation,
    createDiscountRequest
  )
  .get(
    checkAuthentication,
    searchMiddelware,
    sortMiddelware,
    getAllDiscountRequests
  );

discountRequestRouter
  .route("/:id")
  .put(
    checkAuthentication,
    updateDiscountRequestValidation,
    updateDiscountRequest
  )
  .patch(
    checkAuthentication,
    updateDiscountRequestValidation,
    enableDiscountRequest
  )
  .delete(
    checkAuthentication,
    deleteDiscountRequestValidation,
    deleteDiscountRequest
  )
  .get(
    checkAuthentication,
    getDiscountRequestValidation,
    getDiscountRequestById
  );

discountRequestRouter
  .route("/approved/:id")
  .put(
    checkAuthentication,
    updateDiscountRequestValidation,
    approvedDiscountRequest
  );
discountRequestRouter
  .route("/reject/:id")
  .put(
    checkAuthentication,
    updateDiscountRequestValidation,
    rejectDiscountRequest
  );

module.exports = discountRequestRouter;
