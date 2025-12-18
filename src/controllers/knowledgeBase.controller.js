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
const { knowledgeBaseModel } = require("../models/admin.model");

const createknowledgeBaseFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const user_type = req.query.user_type || "all";
  const type = req.query.type || "all";

  let filterObject = {};
  if (user_type != "all") {
    filterObject["user_type"] = user_type;
  }
  if (type != "all") {
    filterObject["type"] = type;
  }
  req.filterObject = filterObject;
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  return next();
});

const createknowledgeBase = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.created_at = Date.now();
  let knowledgeBase = knowledgeBaseModel(mongooseConnection)(req.body);
  await knowledgeBase.save();
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: knowledgeBase });
});
// ****************knowledgeBase update *******************************
const updateknowledgeBase = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let knowledgeBase = await knowledgeBaseModel(
    mongooseConnection
  ).findByIdAndUpdate(id, req.body, { new: true });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !knowledgeBase &&
    next(
      new ApiError(
        "knowledgeBase_not_found",
        410,
        ERROR_TYPES.knowledgeBase_not_found
      )
    );
  knowledgeBase && res.json({ message: "success", data: knowledgeBase });
});
// **************** get knowledgeBase by id *******************************
const getknowledgeBaseById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let knowledgeBase = await knowledgeBaseModel(mongooseConnection).findById(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !knowledgeBase &&
    next(
      new ApiError(
        "knowledgeBase_not_found",
        410,
        ERROR_TYPES.knowledgeBase_not_found
      )
    );
  knowledgeBase && res.json({ message: "success", data: knowledgeBase });
});
// **************** get all zones *******************************
const getAllknowledgeBases = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;
  const result = await knowledgeBaseModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  // Extracting the results
  const knowledgeBases = result[0].data;
  const count = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

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
    data: knowledgeBases,
  });
});

// **************** delete zone *******************************
const deleteknowledgeBase = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let knowledgeBase = await knowledgeBaseModel(
    mongooseConnection
  ).findByIdAndDelete(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !knowledgeBase &&
    next(
      new ApiError(
        "knowledgeBase_already_deleted",
        409,
        ERROR_TYPES.knowledgeBase_already_deleted
      )
    );
  knowledgeBase && res.json({ message: "success", data: knowledgeBase });
});

module.exports = {
  createknowledgeBase,
  updateknowledgeBase,
  getknowledgeBaseById,
  getAllknowledgeBases,
  deleteknowledgeBase,
  createknowledgeBaseFilter,
};
