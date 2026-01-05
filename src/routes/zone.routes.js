const express = require("express");
const {
  createZone,
  checkZoneOptions,
  updateZone,
  getAllZones,
  deleteZone,
  getZoneById,
  checkInZoneApi,
} = require("../controllers/zone.controller");
const {
  createZoneValidation,
  updateZoneValidation,
  deleteZoneValidation,
  getZoneValidation,
} = require("../validation/zone.validation");
const { checkAuthentication } = require("../../main/index");
const zoneRouter = express.Router();

zoneRouter
  .route("/")
  .post(checkAuthentication, createZoneValidation, checkZoneOptions, createZone)
  .get(checkAuthentication, getAllZones);
zoneRouter.post("/checkInZone", checkInZoneApi);
zoneRouter
  .route("/:id")
  .put(checkAuthentication, updateZoneValidation, checkZoneOptions, updateZone)
  .delete(checkAuthentication, deleteZoneValidation, deleteZone)
  .get(checkAuthentication, getZoneValidation, getZoneById);

module.exports = zoneRouter;
