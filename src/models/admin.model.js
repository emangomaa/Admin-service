const { model } = require("mongoose");
const {
  adminSchema,
  contactSchema,
  zoneSchema,
  driverSchema,
  customerSchema,
  tokenSchema,
  notificationSchema,
  carTypeSchema,
  settingsSchema,
  employeeSchema,
  corporateSchema,
  knowledgeBaseSchema,
  ticketSchema,
  rideSchema,
  walletHistoryV2Schema,
  counterSchema,
  corporate_customerSchema,
  voucherSchema,
  corporate_user_inviteSchema,
  projectWalletSchema,
  discountRequestSchema,
  discountProgramSchema,
  platformWalletSchema,
  staticMessageSchema,
  logsSchema,
} = require("../../main");

const adminModel = (mongooseConnection) =>
  mongooseConnection.model("admin", adminSchema);
const contactModel = (mongooseConnection) =>
  mongooseConnection.model("contact", contactSchema);
const zoneModel = (mongooseConnection) =>
  mongooseConnection.model("zone", zoneSchema);
const driverModel = (mongooseConnection) =>
  mongooseConnection.model("driver", driverSchema);
const customerModel = (mongooseConnection) =>
  mongooseConnection.model("customer", customerSchema);
const tokenModel = (mongooseConnection) =>
  mongooseConnection.model("token", tokenSchema);
const notificationModel = (mongooseConnection) =>
  mongooseConnection.model("notification", notificationSchema);

const carTypeModel = (mongooseConnection) =>
  mongooseConnection.model("carType", carTypeSchema);

const settingModel = (mongooseConnection) =>
  mongooseConnection.model("setting", settingsSchema);

const rideModel = (mongooseConnection) =>
  mongooseConnection.model("rides_v2", rideSchema);
const knowledgeBaseModel = (mongooseConnection) =>
  mongooseConnection.model("knowledgeBase", knowledgeBaseSchema);

const ticketModel = (mongooseConnection) =>
  mongooseConnection.model("ticket", ticketSchema);

const walletHistoryV2SchemaModel = (mongooseConnection) =>
  mongooseConnection.model("wallet_history_v2", walletHistoryV2Schema);
const counterModel = (mongooseConnection) =>
  mongooseConnection.model("counter", counterSchema);
const corporateModel = (mongooseConnection) =>
  mongooseConnection.model("corporate", corporateSchema);
const voucherModel = (mongooseConnection) =>
  mongooseConnection.model("voucher", voucherSchema);
const employeeModel = (mongooseConnection) =>
  mongooseConnection.model("employee", employeeSchema);
const corporate_customerModel = (mongooseConnection) =>
  mongooseConnection.model("corporate_customer", corporate_customerSchema);
const corporate_user_inviteModel = (mongooseConnection) =>
  mongooseConnection.model(
    "corporate_user_invite",
    corporate_user_inviteSchema
  );
const projectWalletModel = (mongooseConnection) =>
  mongooseConnection.model("project_wallet", projectWalletSchema);

const discountRequestModel = (mongooseConnection) =>
  mongooseConnection.model("discount_request", discountRequestSchema);
const discountProgramModel = (mongooseConnection) =>
  mongooseConnection.model("discount_Program", discountProgramSchema);
const platformWalletModel = (mongooseConnection) =>
  mongooseConnection.model("platform_wallet", platformWalletSchema);
const staticMessageModel = (mongooseConnection) =>
  mongooseConnection.model("static_message", staticMessageSchema);

const logsModel = (mongooseConnection) =>
  mongooseConnection.model("logs", logsSchema);

module.exports = {
  platformWalletModel,
  projectWalletModel,
  adminModel,
  contactModel,
  zoneModel,
  driverModel,
  customerModel,
  tokenModel,
  notificationModel,
  carTypeModel,
  settingModel,
  knowledgeBaseModel,
  ticketModel,
  rideModel,
  walletHistoryV2SchemaModel,
  counterModel,
  corporateModel,
  voucherModel,
  employeeModel,
  voucherModel,
  corporate_customerModel,
  corporate_user_inviteModel,
  discountRequestModel,
  discountProgramModel,
  staticMessageModel,
  logsModel
};
