const asyncHandler = require("express-async-handler");
const {
  ApiError,
  ERROR_TYPES,
  getOne,
  deleteOne,
  adminNotification,
  ADMIN_NOTIFICATION_TITLES,
  ADMIN_NOTIFICATION_MESSAGES,
  ADMIN_NOTIFICATION_TYPES,
  customLog,
} = require("../../main/index.js");
const { adminModel } = require("../models/admin.model.js");
const addAdminToFB = require("../methods/functions/addAdminToFB.js");
const sendForgetPasswordEmail = require("../methods/functions/sendForegetPaswordEmail.js");
const sendWelcomeEmail = require("../methods/functions/sendWelcomeEmail.js");
const deleteAdminFromFB = require("../methods/functions/deleteAdminFromFB.js");
// @desc Create Admin
// @route POST /api/v1/admin
// @access Private

// *****************create filter object function ***************
const createAdminFilter = asyncHandler(async (req, res, next) => {
  let filterObject = {};
  if (req.query.role && req.query.role != "all") {
    filterObject["role"] = req.query.role;
  }
  req.filterObject = filterObject;
  return next();
});
//************  create Admin   ************* */
const createAdmin = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  let fbConnection = req.app.locals.fbConnection;
  let isExist = await adminModel(mongooseConnection).findOne({
    email: req.body.email,
  });
  if (isExist)
    return next(
      new ApiError("Admin Already Exist!", 409, ERROR_TYPES.admin_Exist)
    );
  const fb_uid = await addAdminToFB(
    req,
    req.body.email,
    "P@ssw0rd",
    req.body.role
  );
  customLog({
    data: `Firebase result : ${fb_uid}`,
  });
  if (fb_uid == "error") {
    return next(
      new ApiError("Admin Already Exist! on fb", 409, ERROR_TYPES.admin_Exist)
    );
  }
  req.body.fb_uid = fb_uid;

  let admin = adminModel(mongooseConnection)(req.body);
  await admin.save();

  adminNotification(
    req.app.locals.fbConnection,
    ADMIN_NOTIFICATION_TITLES.create_new_admin,
    ADMIN_NOTIFICATION_MESSAGES.create_new_admin,
    ADMIN_NOTIFICATION_TYPES.create_new_admin,
    admin._id.toString(),
    req.query.projectId,
    { name: admin.name }
  );
  customLog({
    req,
    onlyMsg: false,
    data: `Done !!! `,
  });

  res.status(201).json({ message: "success", admin });
});

//************  get all admins   ************* */
const getAllAdmins = asyncHandler(async (req, res, next) => {
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  const mongooseConnection = req.app.locals.mongooseConnection;
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 5;
  if (page <= 0) page = 1;
  let skip = (page - 1) * limit;
  let searchObject = {};

  if (req.query.keyword) {
    let keyword = decodeURIComponent(req.query.keyword);

    const regex = /^[^a-zA-Z0-9+]/;
    let specialCharExist = regex.test(keyword);

    if (specialCharExist) {
      if (keyword.startsWith(" ")) {
        keyword = keyword.substring(1);
      } else {
        keyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }

    searchObject = {
      $or: [
        { name: { $regex: new RegExp(keyword, "i") } },
        { phone_number: { $regex: new RegExp(keyword, "i") } },
      ],
    };
  }

  const result = await adminModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        admins: [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: "totalCount" }],
      },
    },
  ]);

  // Extract the admins and count from the result
  const admins = result[0].admins;
  const count = result[0].count[0]?.totalCount || 0;

  // Get the total number of admins (excluding pagination)
  const totalAdmins = await adminModel(mongooseConnection).countDocuments({});

  customLog({
    req,
    onlyMsg: false,
    data: `Done !!! `,
  });

  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    totalAdmins, // Include total number of admins
    data: admins,
  });
});


// ***********************update admin *************************
const updateAdmin = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });
  let { id } = req.params;
  let admin = await adminModel(mongooseConnection).findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  if (!admin) {
    return next(
      new ApiError("admin not found", 410, ERROR_TYPES.admin_not_found)
    );
  }

  const fb = req.app.locals.fbConnection;
  const type = req.body.role || "";
  if (type !== "") {
    const updatedClaims = {
      dispatch: type == "dispatch" || type == "manager" || type == "admin",
      manager: type == "admin" || type == "manager",
      admin: type == "admin",
    };
    await fb.auth().setCustomUserClaims(admin.fb_uid, updatedClaims);
  }
  customLog({
    req,
    onlyMsg: false,
    data: `Done !!! `,
  });

  admin && res.json({ message: "success", data: admin });
});

// **********************get admin by id *************************
const getAdminById = asyncHandler(async (req, res, next) => {
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await adminModel(mongooseConnection).findById(id);
  customLog({
    req,
    onlyMsg: false,
    data: `Done !!! `,
  });

  !OneExist &&
    next(new ApiError(" admin not found", 410, ERROR_TYPES.admin_not_found));
  OneExist && res.json({ message: "success", data: OneExist });
});

// ***********************delete admin ***************************
const deleteAdmin = asyncHandler(async (req, res, next) => {
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let deleted = await adminModel(mongooseConnection).findByIdAndDelete(id);
  // { isDeleted: true },
  // { new: true }

  !deleted &&
    next(
      new ApiError(
        " admin not found",
        409,
        ERROR_TYPES.conflict_admin_already_deleted
      )
    );
  //await deleteAdminFromFB(req, deleted.fb_uid);
  if (deleted) {
    await deleteAdminFromFB(req, deleted.fb_uid);
    customLog({
      req,
      onlyMsg: false,
      data: `Done !!! `,
    });

    res.status(204).json({ message: "success" });
  }
});

// ***********************foregetPaswordEmail for admin ***************************
const foregetPaswordEmail = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { email } = req.body;
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  let admin = await adminModel(mongooseConnection).findOne({ email: email });
  if (!admin) {
    return next(
      new ApiError("admin not found", 410, ERROR_TYPES.admin_not_found)
    );
  } else {
    await sendForgetPasswordEmail(admin.email, req, admin);
    customLog({
      req,
      onlyMsg: false,
      data: `Done !!! `,
    });

    res.json({ message: "success" });
  }
});

const getOneAdmin = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  let { id } = req.params;
  let OneExist = await adminModel(mongooseConnection).findOne({ fb_uid: id });
  !OneExist &&
    next(new ApiError("admin not found", 410, ERROR_TYPES.admin_not_found));

  customLog({
    req,
    onlyMsg: false,
    data: `Done !!! `,
  });

  OneExist && res.json({ message: "success", data: OneExist });
});
const forceResetPassword = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });

  // 1- get all admins
  let admins = await adminModel(mongooseConnection).find();
  customLog({
    req,
    onlyMsg: false,
    data: `all admins: ${admins}`,
  });
  //  2- send reset password for all admins
  admins.length > 0 &&
    admins.forEach((admin) => {
      req.body.name = admin.name;
      sendWelcomeEmail(admin.email, req);
    });

  customLog({
    req,
    onlyMsg: false,
    data: `Start !!! `,
  });
  res.json({ message: "success" });
});

module.exports = {
  createAdmin,
  updateAdmin,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  foregetPaswordEmail,
  getOneAdmin,
  createAdminFilter,
  forceResetPassword,
};
