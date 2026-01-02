const express = require("express");
const {
  updateSetting,
  getSetting,
} = require("../controllers/setting.controller");

const { checkAuthentication } = require("../../main/index");
const settingRouter = express.Router();

settingRouter
  .route("/project")
  .put(checkAuthentication, updateSetting)
  .get(checkAuthentication, getSetting);

module.exports = settingRouter;
