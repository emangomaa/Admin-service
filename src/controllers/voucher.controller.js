const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
  ApiError,
  ERROR_TYPES,
  getNextSequenceValue,
  customLog,
} = require("../../main/index.js");
const {
  voucherModel,
  counterModel,
  corporateModel,
} = require("../models/admin.model.js");
const { generateVoucherCode } = require("../middleware/generateVoucherCode.js");

// @desc Create Admin
// @route POST /api/v1/admin/corporate/voucher
// @access Private

// ****************** voucher filter object ****************
const voucherFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  let filterObject = {};
  if (req.query.corporate) {
    filterObject["corporate_id"] = new ObjectId(req.query.corporate);
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
//************  create voucher with admin   ************* */
const createVoucher = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const sequenceName = "voucher_seq";
  const sequenceValue = await getNextSequenceValue(
    sequenceName,
    counterModel(mongooseConnection)
  );
  let voucherCode = generateVoucherCode(6);
  let { voucher_name, corporate_id } = req.body;
  let exist = await voucherModel(mongooseConnection).findOne({
    voucher_name,
    corporate_id,
  });

  if (exist && exist.deleted === false) {
    return next(
      new ApiError(
        "voucher already exist",
        409,
        ERROR_TYPES.voucher_already_exist
      )
    );
  }
  req.body.code = sequenceValue + "_" + voucherCode;
  let voucher = voucherModel(mongooseConnection)(req.body);
  await voucher.save();
  await corporateModel(mongooseConnection).findByIdAndUpdate(
    req.body.corporate_id,
    { $inc: { vouchers: 1 } }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: voucher });
});

//************  get all vouchers   ************* */
const getAllVouchers = asyncHandler(async (req, res, next) => {
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
  let searchObject = {};

  const result = await voucherModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        vouchers: [
          { $sort: req.app.locals.sort },
          { $skip: skip },
          { $limit: limit },
        ],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the vouchers and count from the result
  const vouchers = result[0].vouchers;
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
    data: vouchers,
  });
});

// ***********************update voucher *************************
const updateVoucher = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;

  let updated = await voucherModel(mongooseConnection).findByIdAndUpdate(
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
    new ApiError(" voucher not found", 410, ERROR_TYPES.voucher_not_found);
  updated && res.json({ message: "success", data: updated });
});

// **********************get voucher by id *************************
const getVoucherById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await voucherModel(mongooseConnection).findById(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !OneExist &&
    next(
      new ApiError(" voucher not found", 410, ERROR_TYPES.voucher_not_found)
    );
  OneExist && res.json({ message: "success", data: OneExist });
});

// ***********************delete corporate ***************************
const deleteVoucher = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await voucherModel(mongooseConnection).findOneAndUpdate(
    { _id: id, deleted: false },
    { deleted: true },
    { new: true }
  );
  !OneExist &&
    next(
      new ApiError(
        " voucher already deleted",
        409,
        ERROR_TYPES.voucher_already_deleted
      )
    );
  await corporateModel(mongooseConnection).findByIdAndUpdate(
    req.body.corporate_id,
    { $inc: { vouchers: -1 } }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  OneExist && res.json({ message: "success", data: OneExist });
});

module.exports = {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  deleteVoucher,
  updateVoucher,
  voucherFilter,
};
