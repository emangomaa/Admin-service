// @desc Create Zone
// @route POST /api/v1/zone
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
  discountRequestModel,
  notificationModel,
  tokenModel,
  customerModel,
  counterModel,
  discountProgramModel,
} = require("../models/admin.model");
const sgMail = require("@sendgrid/mail");
const createDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.created_at = Date.now();
  let discountRequestExist = await discountRequestModel(
    mongooseConnection
  ).findOne({
    customer_id: req.body.customer_id,
  });
  if (discountRequestExist) {
    return next(
      new ApiError(
        "discount request already sent",
        409,
        ERROR_TYPES.discount_request_already_sent
      )
    );
  }
  let customer = await customerModel(mongooseConnection).findByIdAndUpdate(
    req.body.customer_id,
    {
      $set: {
        "project_discount.program": "student",
        "project_discount.status": "pending",
        "project_discount.discount": 10,
      },
    }
  );
  if (!customer) {
    return next(
      new ApiError("customer not found", 410, ERROR_TYPES.customer_not_found)
    );
  }
  const sequenceName = "discount_seq";
  const sequenceValue = await getNextSequenceValue(
    sequenceName,
    counterModel(mongooseConnection)
  );
  req.body.short_id = await sequenceValue.toString();
  req.body.customer_info = {
    first_name: customer.first_name,
    last_name: customer.last_name,
    profile_picture: customer.profile_picture,
    email: customer.email,
    phone_number: customer.phone_number,
    code_phone_number: customer.code_phone_number,
    completed_rides: customer.rides_count.completed,
    canceled_rides: customer.rides_count.canceled,
    rate: customer.review_info.total_avg,
    fb_uid: customer.fb_uid,
  };
  let discountRequest = await discountRequestModel(mongooseConnection)(
    req.body
  );
  await discountRequest.save();

  /// TDO
  /// Notification to admin
  adminNotification(
    req.app.locals.fbConnection,
    ADMIN_NOTIFICATION_TITLES.new_discount_request,
    ADMIN_NOTIFICATION_MESSAGES.new_discount_request.replace(
      "#<NAME",
      customer.first_name || ""
    ),
    ADMIN_NOTIFICATION_TYPES.new_discount_request,
    discountRequest._id.toString(),
    req.query.projectId
  );
  // increate pending requests count on program
  // await discountProgramModel(mongooseConnection).findByIdAndUpdate(
  //   req.body.program_id,
  //   { $inc: { pending_count: 1 } }
  // );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.status(201).json({ message: "success", data: discountRequest });
});
// ****************DiscountRequest update *******************************
const updateDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(mongooseConnection).findById(
    id
  );
  if (!discountRequest) {
    return next(
      new ApiError(
        "discount_request_not_found",
        410,
        ERROR_TYPES.discount_request_not_found
      )
    );
  }
  if (discountRequest.status === "reject") {
    discountRequest = await discountRequestModel(
      mongooseConnection
    ).findByIdAndUpdate(id, { ...req.body, status: "pending" }, { new: true });
    // await discountProgramModel(mongooseConnection).findByIdAndUpdate(
    //   req.body.program_id,
    //   { $inc: { pending_count: 1 } }
    // );
  } else {
    discountRequest = await discountRequestModel(
      mongooseConnection
    ).findByIdAndUpdate(id, req.body, { new: true });
  }

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });

  discountRequest && res.json({ message: "success", data: discountRequest });
});
const enableDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(mongooseConnection).findById(
    id
  );
  if (!discountRequest) {
    return next(
      new ApiError(
        "discount_request_not_found",
        410,
        ERROR_TYPES.discount_request_not_found
      )
    );
  }
  // if (req.body.enabled === true) {
  //   let discountProgram = await discountProgramModel(
  //     mongooseConnection
  //   ).findById(discountRequest.program_id);
  //   if (discountProgram.enabled === false) {
  //     return next(
  //       new ApiError(
  //         "enable discount request not allowed",
  //         410,
  //         ERROR_TYPES.enable_discount_request_not_allowed
  //       )
  //     );
  //   }
  // }

  discountRequest = await discountRequestModel(
    mongooseConnection
  ).findByIdAndUpdate(id, { enabled: req.body.enabled }, { new: true });
  await customerModel(mongooseConnection).findByIdAndUpdate(
    discountRequest.customer_id,
    { "project_discount.enabled": req.body.enabled },
    { new: true }
  );

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });

  discountRequest && res.json({ message: "success", data: discountRequest });
});
// **************** get DiscountRequest by id *******************************
const getDiscountRequestById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(mongooseConnection).findById(
    id
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !discountRequest &&
    next(
      new ApiError(
        "discount_request_not_found",
        410,
        ERROR_TYPES.discount_request_not_found
      )
    );
  discountRequest && res.json({ message: "success", data: discountRequest });
});
// **************** get all zones *******************************
const getAllDiscountRequests = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  const customer_id = req.query.customer_id;
  const status = req.query.status || "all";

  let filterObject = {};
  if (status && status != "all") {
    filterObject["status"] = status;
  }
  if (customer_id) {
    filterObject["customer_id"] = customer_id;
  }

  const result = await discountRequestModel(mongooseConnection).aggregate([
    {
      $match: {
        ...filterObject,
        ...req.app.locals.search,
      },
    },
    {
      $facet: {
        discountRequest: [
          { $sort: { ...req.app.locals.sort } },
          { $skip: skip },
          { $limit: limit },
        ],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the discountRequest and count from the result
  const discountRequest = result[0].discountRequest;
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
    data: discountRequest,
  });
});

// **************** delete zone *******************************
const deleteDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(
    mongooseConnection
  ).findOneAndUpdate({ _id: id, deleted: false }, { deleted: true });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !discountRequest &&
    next(
      new ApiError(
        "discount_request_not_found",
        409,
        ERROR_TYPES.discount_request_not_found
      )
    );
  discountRequest && res.json({ message: "success", data: discountRequest });
});

const approvedDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const fbConnection = req.app.locals.fbConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(
    mongooseConnection
  ).findByIdAndUpdate(id, { status: "approved", enabled: true }, { new: true });
  if (!discountRequest) {
    return next(
      new ApiError(
        "discount_request_not_found",
        410,
        ERROR_TYPES.discount_request_not_found
      )
    );
  }
  /// TODO
  /// Add The Discount For Customer and send notfication and email.
  let customer = await customerModel(mongooseConnection).findByIdAndUpdate(
    discountRequest.customer_id,
    {
      $set: {
        "project_discount.program": discountRequest.discount_program_type,
        "project_discount.status": "approved",
        "project_discount.discount": discountRequest.discount_percentage,
        "project_discount.enabled": true,
      },
    }
  );
  if (!customer) {
    return next(
      new ApiError("customer not found", 410, ERROR_TYPES.customer_not_found)
    );
  }
  // await discountProgramModel(mongooseConnection).findByIdAndUpdate(
  //   discountRequest.program_id,
  //   { $inc: { approved_count: 1, pending_count: -1 } }
  // );
  hitNotification(
    fbConnection,
    notificationModel(mongooseConnection),
    tokenModel(mongooseConnection),
    NOTIFICATION_TITLES.discount_request_approved.customer,
    NOTIFICATION_MESSAGES.discount_request_approved.customer,
    NOTIFICATION_TYPES.discount_request_approved,
    discountRequest._id.toString(),
    discountRequest.customer_id.toString(),
    req.query.projectId,
    null
  );
  sgMail.setApiKey(
    "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"
  );
  const msg = {
    to: customer.email,
    from: "friends@zetaton.com", // Use your verified sender
    subject: "Discount Approvement",
    text: `The admin approved your discount request`,
  };

  sgMail
    .send(msg)
    .then(async () => {})
    .catch((error) => {
      console.error(error);
      return next(
        new ApiError(
          "Failed to send Invitation",
          409,
          ERROR_TYPES.faild_send_invite
        )
      );
    });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });

  res.json({ message: "success", data: discountRequest });
});

const rejectDiscountRequest = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const fbConnection = req.app.locals.fbConnection;
  let { id } = req.params;
  let discountRequest = await discountRequestModel(
    mongooseConnection
  ).findByIdAndUpdate(
    id,
    { status: "reject", reject_reason: req.body.reason },
    { new: true }
  );
  if (!discountRequest) {
    return next(
      new ApiError(
        "discount_request_not_found",
        410,
        ERROR_TYPES.discount_request_not_found
      )
    );
  }
  /// TODO
  /// Remove The Discount For Customer and send notfication / or email.
  let customer = await customerModel(mongooseConnection).findById(
    discountRequest.customer_id
  );
  if (!customer) {
    return next(
      new ApiError("customer not found", 410, ERROR_TYPES.customer_not_found)
    );
  }

  // await discountProgramModel(mongooseConnection).findByIdAndUpdate(
  //   discountRequest.program_id,
  //   { $inc: { rejected_count: 1, pending_count: -1 } }
  // );
  hitNotification(
    fbConnection,
    notificationModel(mongooseConnection),
    tokenModel(mongooseConnection),
    NOTIFICATION_TITLES.discount_request_rejected.customer,
    NOTIFICATION_MESSAGES.discount_request_rejected.customer,
    NOTIFICATION_TYPES.discount_request_rejected,
    "",
    discountRequest.customer_id.toString(),
    req.query.projectId,
    null
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  sgMail.setApiKey(
    "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"
  );
  const msg = {
    to: customer.email,
    from: "friends@zetaton.com", // Use your verified sender
    subject: "Discount Reject",
    text: `The admin rejected your discount request`,
  };

  sgMail
    .send(msg)
    .then(async () => {})
    .catch((error) => {
      console.error(error);
      return next(
        new ApiError(
          "Failed to send Invitation",
          409,
          ERROR_TYPES.faild_send_invite
        )
      );
    });
  res.json({ message: "success", data: discountRequest });
});
module.exports = {
  createDiscountRequest,
  updateDiscountRequest,
  getDiscountRequestById,
  getAllDiscountRequests,
  deleteDiscountRequest,
  approvedDiscountRequest,
  rejectDiscountRequest,
  enableDiscountRequest,
};
