const express = require("express");
const {
  checkAuthentication,
  searchMiddelware,
  sortMiddelware,
} = require("../../main");
const {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  deleteVoucher,
  updateVoucher,
  voucherFilter,
} = require("../controllers/voucher.controller");
const checkZoneOptions = require("../middleware/checkZoneOptions");
const { createVoucherValidation } = require("../validation/voucher.validation");

const voucherRouter = express.Router();

voucherRouter
  .route("/")
  .post(
    checkAuthentication,
    createVoucherValidation,
    checkZoneOptions,
    createVoucher
  )
  .get(
    checkAuthentication,
    voucherFilter,
    searchMiddelware,
    sortMiddelware,
    getAllVouchers
  );

voucherRouter
  .route("/:id")
  .put(checkAuthentication, updateVoucher)
  .delete(checkAuthentication, deleteVoucher)
  .get(checkAuthentication, getVoucherById);

module.exports = voucherRouter;
