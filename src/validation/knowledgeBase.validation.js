const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const createknowledgeBaseValidation = [
  body("title").notEmpty().withMessage("title_required"),
  body("description_html").notEmpty().withMessage("description_html_required"),

  validatorMiddleware,
];
const updateknowledgeBaseValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),

  validatorMiddleware,
];

const deleteknowledgeBaseValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getknowledgeBaseValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createknowledgeBaseValidation,
  updateknowledgeBaseValidation,
  deleteknowledgeBaseValidation,
  getknowledgeBaseValidation,
};
