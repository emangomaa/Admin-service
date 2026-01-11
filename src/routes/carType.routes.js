const express = require("express");
const {
  createCarType,
  updateCarType,
  getCarTypeById,
  getAllCarTypes,
  deleteCarType,
} = require("../controllers/carType.controller");

const {
  createCarTypeValidation,
  updateCarTypeValidation,
  deleteCarTypeValidation,
  getCarTypeValidation,
} = require("../validation/carType.validation");
const { checkAuthentication } = require("../../main/index");
const carTypeRouter = express.Router();

carTypeRouter
  .route("/")
  .post(checkAuthentication, createCarTypeValidation, createCarType);
carTypeRouter.route("/all").get(checkAuthentication, getAllCarTypes);

carTypeRouter
  .route("/:id")
  .put(checkAuthentication, updateCarTypeValidation, updateCarType)
  .delete(checkAuthentication, deleteCarTypeValidation, deleteCarType)
  .get(checkAuthentication, getCarTypeValidation, getCarTypeById);

module.exports = carTypeRouter;
