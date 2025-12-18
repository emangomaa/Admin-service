const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const createticketValidation = [
  body("owner_id").notEmpty().withMessage("owner_id_required"),
  body("owner_type").notEmpty().withMessage("owner_type_required"),
  body("ticket_id").notEmpty().withMessage("ticket_id_required"),
  body("ticket_type").notEmpty().withMessage("ticket_type_required"),
  body("knowledgeBase_id").notEmpty().withMessage("knowledgeBase_id_required"),
  body("description").notEmpty().withMessage("description_required"),

  validatorMiddleware,
];
const updateticketValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),

  validatorMiddleware,
];

const deleteticketValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getticketValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createticketValidation,
  updateticketValidation,
  deleteticketValidation,
  getticketValidation,
};
