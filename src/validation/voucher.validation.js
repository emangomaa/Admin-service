const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const createVoucherValidation = [
  body("voucher_name")
    .notEmpty()
    .withMessage("voucher_name_required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Invalid_name_length"),

  validatorMiddleware,
];
const updateVoucherValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),
  body("voucher_name")
    .optional()
    .notEmpty()
    .withMessage("voucher_name_required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Invalid_name_length"),

  validatorMiddleware,
];
const getVoucherValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),

  validatorMiddleware,
];

module.exports = {
  createVoucherValidation,
  getVoucherValidation,
  updateVoucherValidation,
};
