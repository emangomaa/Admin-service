const { validatorMiddleware } = require("../../main/index");
const { param, body, header, query } = require("express-validator");

const isMinLength4 = (value) => {
  if (!Array.isArray(value) || value.length < 4) {
    throw new Error("Polygon must have at least 4 points");
  }
  return true;
};

const allowedTypes = ["zipCode", "radius", "polygon", "city"];
const createZoneValidation = [
  body("name").notEmpty().withMessage("name_required"),
  body("type")
    .notEmpty()
    .withMessage("type_required")
    .custom((value) => allowedTypes.includes(value))
    .withMessage("Invalid zone type"),
  body("address.lat").notEmpty().withMessage("lat_required"),
  body("address.lng").notEmpty().withMessage("lng_required"),
  body("address.address").notEmpty().withMessage("address_required"),
  body("options.city").optional().notEmpty().withMessage("city_required"),
  body("options.zip_code")
    .optional()
    .notEmpty()
    .withMessage("zip_code_required"),
  body("options.radius.radius_length")
    .optional()
    .notEmpty()
    .withMessage("radius_length_required"),
  body("options.polygon_points")
    .optional()
    .custom(isMinLength4)
    .withMessage("Polygon must have at least 4 points"),
  validatorMiddleware,
];
const updateZoneValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid id length"),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("name_required")
    .isLength({ min: 4 })
    .withMessage("Zone name is too short"),
  body("enabled").optional().notEmpty().withMessage("enabled_required"),
  body("type")
    .optional()
    .notEmpty()
    .withMessage("type_required")
    .custom((value) => allowedTypes.includes(value))
    .withMessage("Invalid zone type"),
  body("address.lat").optional().notEmpty().withMessage("lat_required"),
  body("address.lng").optional().notEmpty().withMessage("lng_required"),
  body("address.address").optional().notEmpty().withMessage("address_required"),
  body("options.city").optional().notEmpty().withMessage("city_required"),
  body("options.zip_code")
    .optional()
    .notEmpty()
    .withMessage("zip_code_required"),
  body("options.radius.radius_length")
    .optional()
    .notEmpty()
    .withMessage("radius_length_required"),
  body("options.polygon_points")
    .optional()
    .custom(isMinLength4)
    .withMessage("Polygon must have at least 4 points"),
  validatorMiddleware,
];

const deleteZoneValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];

const getZoneValidation = [
  param("id")
    .notEmpty()
    .withMessage("id_required")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid_id_length"),
  validatorMiddleware,
];
module.exports = {
  createZoneValidation,
  updateZoneValidation,
  deleteZoneValidation,
  getZoneValidation,
};
