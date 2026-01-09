// @desc Create Static message
// @route POST /api/v1/admin
// @access Private
const {
  ApiError,
  ERROR_TYPES,
  checkInZone,
  customLog,
} = require("../../main/index");
const asyncHandler = require("express-async-handler");
const {
  StaticMessageModel,
  staticMessageModel,
} = require("../models/admin.model");
const sendStaticMessageEmail = require("../methods/functions/sendStaticMessageEmail");

const createStaticMessageFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });

  let filterObject = {};
  if (req.query.status && req.query.status !== "all") {
    filterObject["status"] = req.query.status;
  }
  if (req.query.user_type) {
    filterObject["user_type"] = req.query.user_type;
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

const createStaticMessage = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let staticMessage = staticMessageModel(mongooseConnection)(req.body);
  await staticMessage.save();

  // TODO:  send email for contacts of this message
  let { contacts, subject, body } = req.body;
  contacts.length > 0 &&
    contacts.forEach((contact) => {
      sendStaticMessageEmail(contact, req);
    });

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: staticMessage });
});

// **************** get static message by id *******************************
const getStaticMessageById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let staticMessage = await staticMessageModel(mongooseConnection).findById(id);
  !staticMessage &&
    next(
      new ApiError(
        "static_message_not_found",
        410,
        ERROR_TYPES.static_message_not_found
      )
    );
  staticMessage && res.json({ message: "success", data: staticMessage });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
});
// **************** get all static messages *******************************
const getAllStaticMessages = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;
  const result = await staticMessageModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $sort: req.app.locals.sort },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  // Extracting the results
  const staticMessages = result[0].data;
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
    data: staticMessages,
  });
});

// **************** delete static message *******************************
const deleteStaticMessage = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let staticMessage = await staticMessageModel(
    mongooseConnection
  ).findOneAndUpdate({ _id: id, deleted: false }, { deleted: true });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !staticMessage &&
    next(
      new ApiError(
        "static_message_already_deleted",
        409,
        ERROR_TYPES.static_message_already_deleted
      )
    );
  staticMessage && res.json({ message: "success" });
});

module.exports = {
  createStaticMessageFilter,
  createStaticMessage,
  getStaticMessageById,
  getAllStaticMessages,
  deleteStaticMessage,
};
