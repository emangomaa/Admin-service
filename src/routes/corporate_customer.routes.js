const express = require("express");

const {
  checkAuthentication,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index");
const {
  createCorporateUser,
  getCustomerByPhoneNumber,
  updateCorporateUser,
  deleteCorporateUser,
  getAllInvitations,
  customerFilter,
} = require("../controllers/corporate_customer.controller");
const {
  inviteCorporateValidation,
} = require("../validation/inviteCorporateUser.validation");
const corporate_customerRouter = express.Router();

corporate_customerRouter
  .route("/")
  .post(checkAuthentication, inviteCorporateValidation, createCorporateUser)
  .get(
    checkAuthentication,
    searchMiddelware,
    sortMiddelware,
    customerFilter,
    getAllInvitations
  );

corporate_customerRouter.get("/user", getCustomerByPhoneNumber);
corporate_customerRouter
  .route("/:id")
  .put(checkAuthentication, updateCorporateUser)
  .patch(checkAuthentication, deleteCorporateUser);

module.exports = corporate_customerRouter;
