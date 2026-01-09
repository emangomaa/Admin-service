const asyncHandler = require("express-async-handler");
const {
  ApiError,
  ERROR_zone_typeS,
  ERROR_TYPES,
  customLog,
} = require("../../main/index");

const checkZoneOptions = asyncHandler((req, res, next) => {
  let { zone_type, zone_options } = req.body;
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  if (
    zone_type === "radius" &&
    zone_options &&
    zone_options.radius &&
    zone_options.radius.radius_length
  ) {
    customLog({
      data: `Done !!!`,
      req,
      onlyMsg: false,
    });
    return next();
  } else if (zone_type === "city" && zone_options && zone_options.city) {
    customLog({
      data: `Done !!!`,
      req,
      onlyMsg: false,
    });
    return next();
  } else if (
    zone_type === "polygon" &&
    zone_options &&
    zone_options.polygon_points &&
    zone_options.polygon_points.length >= 4
  ) {
    customLog({
      data: `Done !!!`,
      req,
      onlyMsg: false,
    });
    return next();
  } else if (zone_type === "zipCode" && zone_options && zone_options.zip_code) {
    customLog({
      data: `Done !!!`,
      req,
      onlyMsg: false,
    });
    return next();
  } else {
    // If none of the conditions are met, return an error
    return next(
      new ApiError("Invalid zone options", 400, ERROR_TYPES.not_Found)
    );
  }
});

module.exports = checkZoneOptions;
