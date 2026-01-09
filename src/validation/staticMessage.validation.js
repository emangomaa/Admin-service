const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const createStaticMessageValidation = [
  body("subject").notEmpty().withMessage("subject_required"),
  body("body").notEmpty().withMessage("body_required"),
  body("user_type")
    .notEmpty()
    .withMessage("user_type_required")
    .isIn(["customer", "driver"])
    .withMessage("Invalid_user_type"),

  validatorMiddleware,
];
const getStaticMessageValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id"),

  validatorMiddleware,
];

module.exports = {
  createStaticMessageValidation,
  getStaticMessageValidation,
};
