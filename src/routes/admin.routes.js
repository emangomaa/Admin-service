const express = require("express");
const {
  createAdmin,
  updateAdmin,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  foregetPaswordEmail,
  getOneAdmin,
  createAdminFilter,
  forceResetPassword,
} = require("../controllers/admin.controller");
const {
  createAdminSchema,
  deleteAdminSchema,
  forgotPasswordSchema,
  updateAdminSchema,
  getAdminByFbIdSchema,
  getAdminByIdSchema,
} = require("../validation/admin.validation");

const {
  checkAuthentication,
  checkAdminEmail,
  getUidByEmail,
  chackAdminDispatch,
  chackAdminAdmin,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index.js");
const { adminModel } = require("../models/admin.model");
const {
  getAllContacts,
  contactFilterObject,
  updateContact,
  deleteContact,
  getAllContactsCounts,
} = require("../controllers/contact.controller");
const {
  onChatNotification,
} = require("../triggers/chatNotification.trigger.js");
const {
  projectWalletFilterObject,
  getAllProjectWallet,
} = require("../controllers/projectWallet.controller.js");
const {
  getAllPlatformWallet,
  platformWalletFilterObject,
} = require("../controllers/platformWallet.controller.js");
const adminRouter = express.Router();
adminRouter
  .route("/")
  .post(checkAuthentication, createAdmin)
  .get(
    checkAuthentication,
    checkAdminEmail,
    createAdminFilter,
    searchMiddelware,
    getAllAdmins
  );

adminRouter.get(
  "/contact-us",
  checkAuthentication,
  contactFilterObject,
  searchMiddelware,
  sortMiddelware,
  getAllContacts
);

adminRouter.get(
  "/contact-us-count",
  checkAuthentication,
  getAllContactsCounts
);

adminRouter.get(
  "/project-wallet",
  checkAuthentication,
  projectWalletFilterObject,
  searchMiddelware,
  sortMiddelware,
  getAllProjectWallet
);

adminRouter.get(
  "/platform-wallet",
  checkAuthentication,
  platformWalletFilterObject,
  searchMiddelware,
  sortMiddelware,
  getAllPlatformWallet
);

adminRouter
  .route("/contact-us/:id")
  .put(checkAuthentication, updateContact)
  .delete(checkAuthentication, deleteContact);

adminRouter
  .route("/:id")
  .get(checkAuthentication, getAdminByIdSchema, getAdminById)
  .put(checkAuthentication, checkAdminEmail, updateAdminSchema, updateAdmin)
  .delete(checkAuthentication, checkAdminEmail, deleteAdminSchema, deleteAdmin);

adminRouter
  .route("/foregetPaswordEmail")
  .post(forgotPasswordSchema, foregetPaswordEmail);
adminRouter.route("/forceResetPassword").post(forceResetPassword);

adminRouter.route("/verifyAdmin").post(
  getUidByEmail,
  chackAdminDispatch,
  async (req, res, next) => {
    const mongooseConnection = req.app.locals.mongooseConnection;
    let uid = req.app.locals.uid;
    let admin = await adminModel(mongooseConnection).findOne({ fb_uid: uid });
    req.app.locals.admin = admin;
    return next();
  },
  (req, res) => {
    res.json({ message: "success" });
  }
);

adminRouter.get(
  "/by-firebase-id/:id",
  checkAuthentication,
  checkAdminEmail,
  getAdminByFbIdSchema,
  getOneAdmin
);
adminRouter.route("/notification/sendNotification").post(onChatNotification);
module.exports = adminRouter;
