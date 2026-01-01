const asyncHandler = require("express-async-handler");
const { ApiError, ERROR_TYPES, customLog } = require("../../main/index.js");
const { corporateModel } = require("../models/admin.model.js");

// @desc Create Admin
// @route POST /api/v1/admin
// @access Private

// ****************** corporates filter object ****************
const corporatesFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  let filterObject = {};
  if (req.query.status && req.query.status != "all") {
    filterObject["status"] = req.query.status;
  }
  if (req.query.deleted && req.query.deleted === "true") {
    filterObject["deleted"] = true;
  } else {
    filterObject["deleted"] = false;
  }
  req.filterObject = filterObject;
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  return next();
});
//************  create corporate with admin   ************* */
const createCorporate = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.status = "accepted";
  req.body.full_phone_number =
    req.body.code_phone_number + req.body.phone_number;
  let exist = await corporateModel(mongooseConnection).findOne({
    $or: [
      { corporate_name: req.body.corporate_name.toLowerCase() },
      { full_phone_number: req.body.full_phone_number },
      { email: req.body.email },
    ],
  });

  if (exist && exist.deleted === false) {
    return next(
      new ApiError(
        "corporate already exist",
        409,
        ERROR_TYPES.corporate_already_exist
      )
    );
  }
  req.body.corporate_name = req.body.corporate_name.toLowerCase();
  let corporate = corporateModel(mongooseConnection)(req.body);
  await corporate.save();
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: corporate });
});

//************  get all corporates   ************* */
const getAllCorporates = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 5;
  if (page <= 0) page = 1;
  let skip = (page - 1) * limit;

  const result = await corporateModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        corporates: [
          { $sort: req.app.locals.sort },
          { $skip: skip },
          { $limit: limit },
        ],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the corporates and count from the result
  const corporates = result[0].corporates;
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
    data: corporates,
  });
});

// ***********************update corporate *************************
const updateCorporate = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  if (req.body.phone_number || req.body.code_phone_number) {
    req.body.full_phone_number =
      req.body.code_phone_number + req.body.phone_number;
  }
  if (req.body.corporate_name) {
    let exist = await corporateModel(mongooseConnection).findOne({
      corporate_name: req.body.corporate_name.toLowerCase(),
    });

    if (exist && exist.deleted === false) {
      return next(
        new ApiError("dublicate data", 409, ERROR_TYPES.corporate_already_exist)
      );
    }
  }

  let updated = await corporateModel(mongooseConnection).findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    { new: true }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !updated &&
    new ApiError(" corporate not found", 410, ERROR_TYPES.corporate_not_found);
  updated && res.json({ message: "success", data: updated });
});

// **********************get corporate by id *************************
const getCorporateById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await corporateModel(mongooseConnection).findById(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !OneExist &&
    next(
      new ApiError(" corporate not found", 410, ERROR_TYPES.corporate_not_found)
    );
  OneExist && res.json({ message: "success", data: OneExist });
});

// ***********************delete corporate ***************************
const deleteCorporate = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await corporateModel(mongooseConnection).findByIdAndUpdate(
    id,
    { deleted: true },
    { new: true }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !OneExist &&
    next(
      new ApiError(
        " corporate already deleted",
        409,
        ERROR_TYPES.corporate_already_deleted
      )
    );
  OneExist && res.json({ message: "success", data: OneExist });
});

module.exports = {
  createCorporate,
  getAllCorporates,
  corporatesFilter,
  updateCorporate,
  getCorporateById,
  deleteCorporate,
};
