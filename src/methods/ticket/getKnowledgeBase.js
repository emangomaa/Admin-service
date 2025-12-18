const asyncHandler = require("express-async-handler");
const {
  ApiError,
  ERROR_TYPES,
  checkInZone,
  customLog,
} = require("../../../main/index");
const {
  driverModel,
  customerModel,
  knowledgeBaseModel,
} = require("../../models/admin.model");

const getKnowledgeBase = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;

  let knowledgeBaseData = await knowledgeBaseModel(mongooseConnection).findById(
    req.body.knowledgeBase_id
  );
  req.body.knowledgeBase = {};
  req.body.knowledgeBase = knowledgeBaseData;
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  return next();
});
module.exports = getKnowledgeBase;
