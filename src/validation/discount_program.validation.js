const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const createDiscountProgramValidation = [
  body("discount_program").notEmpty().withMessage("discount_program_required"),

  validatorMiddleware,
];
const updateDiscountProgramValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),
  validatorMiddleware,
];

const deleteDiscountProgramValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getDiscountProgramValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createDiscountProgramValidation,
  updateDiscountProgramValidation,
  deleteDiscountProgramValidation,
  getDiscountProgramValidation,
};
