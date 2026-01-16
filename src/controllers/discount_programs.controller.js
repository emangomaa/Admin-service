// @desc Create discount program
// @route POST /api/v1/admin
// @access Private
const {
  ApiError,
  ERROR_TYPES,
  checkInZone,
  customLog,
  ADMIN_NOTIFICATION_TITLES,
  ADMIN_NOTIFICATION_MESSAGES,
  ADMIN_NOTIFICATION_TYPES,
  adminNotification,
  hitNotification,
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TITLES,
  NOTIFICATION_TYPES,
  getNextSequenceValue,
} = require("../../main/index");
const asyncHandler = require("express-async-handler");
const {
  notificationModel,
  tokenModel,
  customerModel,
  counterModel,
  discountProgramModel,
  discountRequestModel,
} = require("../models/admin.model");
const sgMail = require("@sendgrid/mail");
// ****************** حقخلقشة filter object ****************
const programFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  let filterObject = {};
 
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
const createDiscountProgram = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let discountProgramExist = await discountProgramModel(
    mongooseConnection
  ).findOne({
    discount_program: req.body.discount_program,
    deleted:false
  });
  if (discountProgramExist) {
    return next(
      new ApiError(
        "discount program already exist",
        409,
        ERROR_TYPES.discount_program_already_exist
      )
    );
  }

  const sequenceName = "discount_program_seq";
  const sequenceValue = await getNextSequenceValue(
    sequenceName,
    counterModel(mongooseConnection)
  );
  req.body.short_id = await sequenceValue.toString();
  req.body.discount_program = req.body.discount_program.toLowerCase();
  let discountProgram = await discountProgramModel(mongooseConnection)(
    req.body
  );
  await discountProgram.save();

  /// TDO
  /// Notification to admin
  adminNotification(
    req.app.locals.fbConnection,
    ADMIN_NOTIFICATION_TITLES.new_discount_program,
    ADMIN_NOTIFICATION_MESSAGES.new_discount_program,
    ADMIN_NOTIFICATION_TYPES.new_discount_program,
    discountProgram._id.toString(),
    req.query.projectId
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: discountProgram });
});
// ****************DiscountRequest update *******************************
const updateDiscountProgram = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;

  if (req.body.discount_program) {
    let exist = await discountProgramModel(mongooseConnection).findOne({
      discount_program: req.body.discount_program.toLowerCase(),
    });

    if (exist && exist.deleted === false) {
      return next(
        new ApiError(
          "dublicate data",
          409,
          ERROR_TYPES.discount_program_already_exist
        )
      );
    }
  }

  let updated = await discountProgramModel(mongooseConnection).findOneAndUpdate(
    { _id: id, deleted: false },
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
    next(
      new ApiError(
        " discount program not found",
        410,
        ERROR_TYPES.discount_program_not_found
      )
    );
  updated && res.json({ message: "success", data: updated });
});
const enableDiscountProgram = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountProgram = await discountProgramModel(mongooseConnection).findById(
    id
  );
  if (!discountProgram) {
    return next(
      new ApiError(
        "discount_program_not_found",
        410,
        ERROR_TYPES.discount_program_not_found
      )
    );
  }

  discountProgram = await discountProgramModel(
    mongooseConnection
  ).findByIdAndUpdate(id, { enabled: req.body.enabled }, { new: true });
  if (req.body.enabled === false) {
    await discountRequestModel(mongooseConnection).updateMany(
      { program_id: discountProgram._id }, // Filter criteria
      { $set: { enabled: req.body.enabled } } // Update action
    );
  }

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });

  discountProgram && res.json({ message: "success", data: discountProgram });
});
// **************** get DiscountRequest by id *******************************
const getDiscountProgramById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountProgram = await discountProgramModel(mongooseConnection).findById(
    id
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !discountProgram &&
    next(
      new ApiError(
        "discount_program_not_found",
        410,
        ERROR_TYPES.discount_program_not_found
      )
    );
  discountProgram && res.json({ message: "success", data: discountProgram });
});
// **************** get all zones *******************************
const getAllDiscountPrograms = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  const result = await discountProgramModel(mongooseConnection).aggregate([
    {
      $match: {
        ...req.app.locals.search,
        ...req.filterObject
      },
    },
    {
      $facet: {
        discountProgram: [
          { $sort: { ...req.app.locals.sort } },
          { $skip: skip },
          { $limit: limit },
        ],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the discountRequest and count from the result
  const discountPrograms = result[0].discountProgram;
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
    data: discountPrograms,
  });
});
// **************** delete zone *******************************
const deleteDiscountProgram = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountProgram = await discountProgramModel(
    mongooseConnection
  ).findOneAndUpdate({ _id: id, deleted: false }, { deleted: true });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  if (!discountProgram) {
    next(
      new ApiError(
        "discount_program_not_found",
        409,
        ERROR_TYPES.discount_program_not_found
      )
    );
  }

  await discountRequestModel(mongooseConnection).updateMany(
    { program_id: discountProgram._id }, // Filter criteria
    { $set: { enabled: false } } // Update action
  );
  res.json({ message: "success", data: discountProgram });
});
module.exports = {
  createDiscountProgram,
  getDiscountProgramById,
  getAllDiscountPrograms,
  updateDiscountProgram,
  deleteDiscountProgram,
  enableDiscountProgram,
  programFilter
};
