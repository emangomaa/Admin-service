const asyncHandler = require("express-async-handler");
const {
  ApiError,
  ERROR_TYPES,
  getNextSequenceValue,
  hitNotification,
  NOTIFICATION_TITLES,
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TYPES,
  customLog,
} = require("../../main/index.js");
const {
  voucherModel,
  corporateModel,
  corporate_cust,
  customerModel,
  corporate_user_inviteModel,
  notificationModel,
  tokenModel,
} = require("../models/admin.model.js");
const sgMail = require("@sendgrid/mail");
// @desc Create customer
// @route POST /api/v1/admin/corporate/customer
// @access Private

// ****************** customer filter object ****************
const customerFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  let filterObject = {};
  if (req.query.corporate) {
    filterObject["corporate_id"] = req.query.corporate;
  }
  req.filterObject = filterObject;
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  return next();
});

//************  create customer with admin corporate  ************* */
const createCorporateUser = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const fbConnection = req.app.locals.fbConnection;
  let { projectId } = req.query;
  let { corporate_id, email, voucher_details, corporate_user_type } = req.body;
  // 1- check if this phone number exist on app customers
  req.body.full_phone_number =
    req.body.code_phone_number + req.body.phone_number;

  let exist_user = await customerModel(mongooseConnection).findOne({
    full_phone_number: req.body.full_phone_number,
  });
  if (!exist_user) {
    // 2- check if this user invited before
    let corporate_invite = await corporate_user_inviteModel(
      mongooseConnection
    ).findOne({
      $or: [
        { full_phone_number: req.body.full_phone_number },
        { email: req.body.email },
      ],
    });

    if (corporate_invite) {
      return next(
        new ApiError(
          "user already invited",
          409,
          ERROR_TYPES.user_already_invited
        )
      );
    } else {
      // 3- create user invite and send invitation

      sgMail.setApiKey(
        process.env.SG_KEY
      );
      const msg = {
        to: email,
        from: "friends@zetaton.com", // Use your verified sender
        subject: "App link invitation",
        text: `App link ${req.app.locals.keys.AppLink}. Please Signup.`,
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

      req.body.voucher_details.voucher_balance =
        req.body.voucher_details.max_voucher_price;
      let invite = corporate_user_inviteModel(mongooseConnection)(req.body);
      await invite.save();
      customLog({
        data: `Done !!!`,
        req,
        onlyMsg: false,
      });
      res.json({ message: "success", inviteData: invite });
      // notification on dashboard invitation sent successfully TODO:web
    }
  } else {
    // 4- if exist update this user with corporate data
    let { is_corporate_customer, is_corporate_employee } = exist_user;
    switch (corporate_user_type) {
      case "customer":
        is_corporate_customer = true;
        is_corporate_employee = false;
        await corporateModel(mongooseConnection).findByIdAndUpdate(
          corporate_id,
          {
            $inc: { customers: 1 },
          }
        );
        await voucherModel(mongooseConnection).findOneAndUpdate(
          { corporate_id },
          {
            $inc: { customers: 1 },
          }
        );

        hitNotification(
          req.app.locals.fbConnection,
          notificationModel(mongooseConnection),
          tokenModel(mongooseConnection),
          NOTIFICATION_TITLES.corporate_user.customer.replace(
            "#<USER>",
            "customer"
          ),
          NOTIFICATION_MESSAGES.corporate_user.customer.replace(
            "#<USER>",
            "customer"
          ),
          NOTIFICATION_TYPES.corporate_user,
          "",
          exist_user._id.toString(),
          projectId,
          null
        );
        break;
      case "employee":
        is_corporate_employee = true;
        is_corporate_customer = false;
        await corporateModel(mongooseConnection).findByIdAndUpdate(
          corporate_id,
          {
            $inc: { employees: 1 },
          }
        );
        await voucherModel(mongooseConnection).findOneAndUpdate(
          { corporate_id },
          {
            $inc: { employees: 1 },
          }
        );
        hitNotification(
          req.app.locals.fbConnection,
          notificationModel(mongooseConnection),
          tokenModel(mongooseConnection),
          NOTIFICATION_TITLES.corporate_user.customer.replace(
            "#<USER>",
            "employee"
          ),
          NOTIFICATION_MESSAGES.corporate_user.customer.replace(
            "#<USER>",
            "employee"
          ),
          NOTIFICATION_TYPES.corporate_user,
          "",
          exist_user._id.toString(),
          projectId,
          null
        );
        break;

      default:
        break;
    }

    // user updated with this corporate and voucher
    voucher_details.voucher_balance = voucher_details.max_voucher_price;
    await customerModel(mongooseConnection).findByIdAndUpdate(exist_user._id, {
      corporate_id,
      voucher_details,
      is_corporate_customer,
      is_corporate_employee,
      corporate_user_enabled: true,
    });

    // TODO: send notification for this user that this account is employee or customer  to a corporate and have a voucher
    customLog({
      data: `Done !!!`,
      req,
      onlyMsg: false,
    });
    res.json({ message: "success", data: exist_user });
  }
});

// /****************************get all invitations */
const getAllInvitations = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 5;
  if (page <= 0) page = 1;
  let skip = (page - 1) * limit;
  let searchObject = {};

  if (req.query.keyword) {
    let keyword = decodeURIComponent(req.query.keyword);
    console.log("keyword", keyword);

    const regex = /^[^a-zA-Z0-9+]/;
    let specialCharExist = regex.test(keyword);

    if (specialCharExist) {
      if (keyword.startsWith(" ")) {
        keyword = keyword.substring(1);
        console.log("keyword after +", keyword);
      } else {
        console.log("**************keyword**********", keyword);
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
 const result = await corporate_user_inviteModel(mongooseConnection).aggregate([
   { $match: { ...req.filterObject, ...req.app.locals.search } },
   {
     $facet: {
       invitations: [{ $skip: skip }, { $limit: limit }],
       count: [{ $count: "totalCount" }],
     },
   },
 ]);

 // Extract the admins and count from the result
 const invitations = result[0].invitations;
 const count = result[0].count[0]?.totalCount || 0;

  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: invitations,
  });
});
// ***********************update customer *************************
const updateCorporateUser = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  // Using $set to ensure only provided fields are updated
  const updateObject = {};

  if (req.body.voucher_details) {
    Object.keys(req.body.voucher_details).forEach((key) => {
      updateObject[`voucher_details.${key}`] = req.body.voucher_details[key];
    });
  }
  let updated = await customerModel(mongooseConnection).findByIdAndUpdate(
    id,
    {
      $set: updateObject,
    },
    { new: true }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });

  !updated &&
    new ApiError(" customer not found", 410, ERROR_TYPES.customer_not_found);
  updated && res.json({ message: "success", data: updated });
});

// ***********************delete customer ***************************
const deleteCorporateUser = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let updates = {};
  switch (req.body.user_type) {
    case "customer":
      updates["is_corporate_customer"] = false;
      break;

    case "employee":
      updates["is_corporate_employee"] = false;
      break;
    default:
      break;
  }
  let OneExist = await customerModel(mongooseConnection).findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        ...updates,
        voucher_details: {},
        corporate_id: "",
        corporate_user_enabled: false,
      },
    },
    { new: true }
  );
  if (!OneExist) {
    return next(
      new ApiError(
        " user already deleted",
        409,
        ERROR_TYPES.user_already_deleted
      )
    );
  }

  switch (req.body.user_type) {
    case "customer":
      await corporateModel(mongooseConnection).findByIdAndUpdate(
        req.body.corporate_id,
        { $inc: { customers: -1 } }
      );
      await voucherModel(mongooseConnection).findByIdAndUpdate(
        { _id: req.body.voucher_id },
        { $inc: { customers: -1 } }
      );
      break;
    case "employee":
      await corporateModel(mongooseConnection).findByIdAndUpdate(
        req.body.corporate_id,
        { $inc: { employees: -1 } }
      );
      await voucherModel(mongooseConnection).findByIdAndUpdate(
        { _id: req.body.voucher_id },
        { $inc: { employees: -1 } }
      );
      break;

    default:
      break;
  }
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.json({ message: "success", data: OneExist });
});

const getCustomerByPhoneNumber = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { phoneNumber } = req.query;
  let OneExist = await customerModel(mongooseConnection).findOne({
    phone_number: phoneNumber,
  });
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !OneExist &&
    next(
      new ApiError(" customer not found", 410, ERROR_TYPES.customer_not_found)
    );
  OneExist && res.json({ message: "success", data: OneExist });
});
module.exports = {
  updateCorporateUser,
  deleteCorporateUser,
  customerFilter,
  createCorporateUser,
  getCustomerByPhoneNumber,
  getAllInvitations
};
