const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const createDiscountRequestValidation = [
  body("customer_id")
    .notEmpty()
    .withMessage("customer_id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),

  validatorMiddleware,
];
const updateDiscountRequestValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),

  validatorMiddleware,
];

const deleteDiscountRequestValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getDiscountRequestValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createDiscountRequestValidation,
  updateDiscountRequestValidation,
  deleteDiscountRequestValidation,
  getDiscountRequestValidation,
};
