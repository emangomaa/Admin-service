// @desc Create Zone
// @route POST /api/v1/zone
// @access Private
const { ApiError, ERROR_TYPES, checkInZone } = require("../../main/index");
const asyncHandler = require("express-async-handler");
const { zoneModel } = require("../models/admin.model");
// ************check zone options *******************

const checkZoneOptions = asyncHandler((req, res, next) => {
  let { type, options, enabled } = req.body;
  console.log(options);
  console.log(enabled);
  // if (enabled !== undefined && !type) {
  //   return next();
  // }
  if (
    type === "radius" &&
    options &&
    options.radius &&
    options.radius.radius_length
  ) {
    return next();
  } else if (type === "city" && options && options.city) {
    return next();
  } else if (
    type === "polygon" &&
    options &&
    options.polygon_points &&
    options.polygon_points.length >= 4
  ) {
    return next();
  } else if (type === "zipCode" && options && options.zip_code) {
    return next();
  } else {
    // If none of the conditions are met, return an error
    return next(
      new ApiError("Invalid options", 400, ERROR_TYPES.invalid_zone_options)
    );
  }
});
// ****************zone create *******************************
const createZone = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.created_at = Date.now();
  let zone = zoneModel(mongooseConnection)(req.body);
  await zone.save();
  res.status(201).json({ message: "success", data: zone });
});
// ****************zone update *******************************
const updateZone = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let zone = await zoneModel(mongooseConnection).findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  !zone &&
    next(new ApiError("zone_not_found", 410, ERROR_TYPES.zone_not_found));
  zone && res.json({ message: "success", data: zone });
});
// **************** get zone by id *******************************
const getZoneById = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let zone = await zoneModel(mongooseConnection).findById(id);
  !zone &&
    next(new ApiError("zone_not_found", 410, ERROR_TYPES.zone_not_found));
  zone && res.json({ message: "success", data: zone });
});
// **************** get all zones *******************************
const getAllZones = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;
  let zones = await zoneModel(mongooseConnection)
    .find({ name: { $regex: new RegExp(req.query.keyword, "i") } })
    .skip(skip)
    .limit(limit);

  const count = await zoneModel(mongooseConnection).countDocuments({
    name: { $regex: new RegExp(req.query.keyword, "i") },
  });
  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: zones,
  });
});

// **************** delete zone *******************************
const deleteZone = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let zone = await zoneModel(mongooseConnection).findByIdAndDelete(id);
  !zone &&
    next(
      new ApiError(
        "zone_not_found",
        409,
        ERROR_TYPES.conflict_zone_already_deleted
      )
    );
  zone && res.json({ message: "success", data: zone });
});

const checkInZoneApi = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let address = req.body;
  let zones = await zoneModel(mongooseConnection).find({ enabled: true });
  let data = await checkInZone(zones, address);
  res.json({ message: "success", ...data });
});

module.exports = {
  createZone,
  checkZoneOptions,
  updateZone,
  getZoneById,
  getAllZones,
  deleteZone,
  checkInZoneApi,
};
