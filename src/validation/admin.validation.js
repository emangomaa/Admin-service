const { globalError } = require("../../main/index.js");
const { ApiError } = require("../../main/index.js");
// import { admin_id_requred, admin_type_wrong } from "../errorCodeEnums";
const Joi = require("joi");
const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const createAdminSchema = [
  body("name")
    .notEmpty()
    .withMessage("name_required")
    .isLength({ min: 3 })
    .withMessage("name_min_3_letters")
    .isLength({ max: 35 })
    .withMessage("name_max_35_letters"),

  body("email")
    .notEmpty()
    .withMessage("email_required")
    .isEmail()
    .withMessage("email_not_valid"),

  body("role")
    .notEmpty()
    .withMessage("role_required")
    .custom((val) => {
      return ["manager", "dispatch", "admin"].includes(val);
    })
    .withMessage("role_not_valid"),

  validatorMiddleware,
];

const deleteAdminSchema = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id_length_24"),
  validatorMiddleware,
];

const updateAdminSchema = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id_length_24"),
  body("name").optional().notEmpty().withMessage("name_required"),
  body("profile_picture")
    .optional()
    .notEmpty()
    .withMessage("profile_picture_required"),
  body("phone_number")
    .optional()
    .notEmpty()
    .withMessage("phone_number_required"),
  body("email")
    .optional()
    .notEmpty()
    .withMessage("email_required")
    .isEmail()
    .withMessage("email_not_valid"),
  validatorMiddleware,
];

const forgotPasswordSchema = [
  body("email")
    .notEmpty()
    .withMessage("email_required")
    .isEmail()
    .withMessage("email_not_valid"),

  validatorMiddleware,
];

const getAdminByFbIdSchema = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 28, max: 28 })
    .withMessage("invalid_id_length_28"),

  validatorMiddleware,
];

const getAdminByIdSchema = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("invalid_id_length_24"),
  validatorMiddleware,
];

module.exports = {
  createAdminSchema,
  updateAdminSchema,
  deleteAdminSchema,
  getAdminByFbIdSchema,
  forgotPasswordSchema,
  getAdminByIdSchema,
};
