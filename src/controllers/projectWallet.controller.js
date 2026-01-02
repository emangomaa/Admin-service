const { walletHistoryV2SchemaModel } = require("../models/admin.model");
const asyncHandler = require("express-async-handler");
const { ApiError, ERROR_TYPES } = require("../../main/index");

const projectWalletFilterObject = asyncHandler((req, res, next) => {
  let filterObject = {};
  if (req.query.type && req.query.type !== "all") {
    const types = req.query.type.split(",").map((type) => type.trim());
    filterObject.type = { $in: types };
  }

  let now = new Date();

  let rangeDate = {};
  let endAt = req.query.end;
  let startAt = req.query.start;
  if (startAt) {
    rangeDate["$gte"] = startAt;
  }
  if (endAt) {
    rangeDate["$lte"] = endAt;
  }

  if (rangeDate["$gte"] || rangeDate["$gte"])
    filterObject["created_at"] = rangeDate;
  console.log(filterObject);
  req.filterObject = filterObject;
  return next();
});

const getAllProjectWallet = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;

  console.log("here ??");

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  console.log({ ...req.filterObject, uid: "admin", ...req.app.locals.search });

  let projectWallet = await walletHistoryV2SchemaModel(mongooseConnection)
    .find({ ...req.filterObject, uid: "admin", ...req.app.locals.search })
    .sort(req.app.locals.sort)
    .skip(skip)
    .limit(limit);
  console.log("data?");
  console.log(projectWallet.length);

  let count = await walletHistoryV2SchemaModel(
    mongooseConnection
  ).countDocuments({
    ...req.filterObject,
    ...req.app.locals.search,
  });

  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: projectWallet,
  });
});

module.exports = {
  projectWalletFilterObject,
  getAllProjectWallet,
};
