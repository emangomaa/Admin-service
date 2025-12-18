const { validatorMiddleware } = require("../../main/index.js");
const { param, body, header, query } = require("express-validator");

const setPasswordValidation = [
  body("userType")
    .notEmpty()
    .withMessage("userType_required")
    .isIn(["driver", "customer"])
    .withMessage("Invalid_user_type"),
  body("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id"),
  body("iv").notEmpty().withMessage("iv_required"),
  body("password").notEmpty().withMessage("password_required"),

  validatorMiddleware,
];
const loginPasswordValidation = [
  body("userType")
    .notEmpty()
    .withMessage("userType_required")
    .isIn(["driver", "customer"])
    .withMessage("Invalid_user_type"),
  body("phoneNumber").notEmpty().withMessage("phoneNumber_required"),
  body("iv").notEmpty().withMessage("iv_required"),
  body("password").notEmpty().withMessage("password_required"),

  validatorMiddleware,
];

module.exports = {
  setPasswordValidation,
  loginPasswordValidation,
};
