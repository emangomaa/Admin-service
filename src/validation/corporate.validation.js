const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const createCorporateValidation = [
  body("corporate_name")
    .notEmpty()
    .withMessage("corporate_name_required")
    .isLength({ min: 3 })
    .withMessage("name_min_3_letters"),
  body("contact_person")
    .notEmpty()
    .withMessage("contact_person_required")
    .isLength({ min: 3 })
    .withMessage("name_min_3_letters"),

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
const updateCorporateValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),
  body("corporate_name")
    .optional()
    .notEmpty()
    .withMessage("corporate_name_required")
    .isLength({ min: 3 })
    .withMessage("name_min_3_letters"),
  body("contact_person")
    .optional()
    .notEmpty()
    .withMessage("contact_person_required")
    .isLength({ min: 3 })
    .withMessage("name_min_3_letters"),

  body("email")
    .optional()
    .notEmpty()
    .withMessage("email_required")
    .isEmail()
    .withMessage("email_not_valid"),
  body("phone_number")
    .optional()
    .notEmpty()
    .withMessage("phone_number_required"),
  body("code_phone_number")
    .optional()
    .notEmpty()
    .withMessage("code_phone_number_required"),
  body("enabled")
    .optional()
    .notEmpty()
    .withMessage("value_required")
    .isIn([true, false])
    .withMessage("invalid_value"),
  body("status")
    .optional()
    .notEmpty()
    .withMessage("status_required")
    .isIn(["pending", "accepted", "rejected"])
    .withMessage("invalid_value"),

  validatorMiddleware,
];
const getCorporateValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),

  validatorMiddleware,
];

module.exports = {
  createCorporateValidation,
  getCorporateValidation,
  updateCorporateValidation,
};
