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
const { carTypeModel } = require("../models/admin.model");

const createCarType = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.created_at = Date.now();
  let carType = carTypeModel(mongooseConnection)(req.body);
  await carType.save();
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: carType });
});
// ****************carType update *******************************
const updateCarType = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let carType = await carTypeModel(mongooseConnection).findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !carType &&
    next(new ApiError("carType_not_found", 410, ERROR_TYPES.carType_not_found));
  carType && res.json({ message: "success", data: carType });
});
// **************** get carType by id *******************************
const getCarTypeById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let carType = await carTypeModel(mongooseConnection).findById(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !carType &&
    next(new ApiError("carType_not_found", 410, ERROR_TYPES.carType_not_found));
  carType && res.json({ message: "success", data: carType });
});
// **************** get all zones *******************************
const getAllCarTypes = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;
  const result = await carTypeModel(mongooseConnection).aggregate([
    {
      $match: {
        name: { $regex: new RegExp(req.query.keyword, "i") },
      },
    },
    {
      $facet: {
        carTypes: [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the carTypes and count from the result
  const carTypes = result[0].carTypes;
  const count = result[0].count[0]?.totalCount || 0;

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: carTypes,
  });
});

// **************** delete zone *******************************
const deleteCarType = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let carType = await carTypeModel(mongooseConnection).findByIdAndDelete(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !carType &&
    next(
      new ApiError(
        "zone_not_found",
        409,
        ERROR_TYPES.conflict_zone_already_deleted
      )
    );
  carType && res.json({ message: "success", data: carType });
});

module.exports = {
  createCarType,
  updateCarType,
  getCarTypeById,
  getAllCarTypes,
  deleteCarType,
};
