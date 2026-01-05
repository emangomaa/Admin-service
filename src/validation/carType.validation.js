const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const createCarTypeValidation = [
  body("name").notEmpty().withMessage("name_required"),
  body("image").notEmpty().withMessage("name_required"),

  validatorMiddleware,
];
const updateCarTypeValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),

  validatorMiddleware,
];

const deleteCarTypeValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getCarTypeValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createCarTypeValidation,
  updateCarTypeValidation,
  deleteCarTypeValidation,
  getCarTypeValidation,
};
