const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const inviteCorporateValidation = [
  body("corporate_id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),
  body("corporate_user_type")
    .notEmpty()
    .withMessage("corporate_user_required")
    .isIn(["customer", "employee"])
    .withMessage("Invalid_user_type"),

  body("email")
    .notEmpty()
    .withMessage("email_required")
    .isEmail()
    .withMessage("email_not_valid"),
  body("phone_number").notEmpty().withMessage("phone_number_required"),
  body("code_phone_number")
    .notEmpty()
    .withMessage("code_phone_number_required"),

  validatorMiddleware,
];

module.exports = {
  inviteCorporateValidation,
};
