// @desc Create Zone
// @route POST /api/v1/zone
// @access Private
const {
  ApiError,
  ERROR_TYPES,
  checkInZone,
  customLog,
} = require("../../main/index");
const asyncHandler = require("express-async-handler");
const { settingModel } = require("../models/admin.model");

// ****************carType update *******************************
const updateSetting = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let data = {};
  let setting = await settingModel(mongooseConnection).find();
  if (setting.length > 0) {
    data = await settingModel(mongooseConnection).findByIdAndUpdate(
      setting[0]._id,
      req.body,
      { new: true }
    );
  } else {
    let settingData = settingModel(mongooseConnection)(req.body);
    data = await settingData.save();
  }
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.json({ message: "success", data: data });
});

const getSetting = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;

  let setting = await settingModel(mongooseConnection).find().limit(1);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.json({
    message: "success",
    data: setting.length > 0 ? setting[0] : {},
  });
});

module.exports = {
  updateSetting,
  getSetting,
};
