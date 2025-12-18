const express = require("express");
const {
  createknowledgeBase,
  updateknowledgeBase,
  getknowledgeBaseById,
  getAllknowledgeBases,
  deleteknowledgeBase,
  createknowledgeBaseFilter,
} = require("../controllers/knowledgeBase.controller");

const {
  createknowledgeBaseValidation,
  updateknowledgeBaseValidation,
  deleteknowledgeBaseValidation,
  getknowledgeBaseValidation,
} = require("../validation/knowledgeBase.validation");
const { checkAuthentication, searchMiddelware } = require("../../main/index");
const knowledgeBaseRouter = express.Router();

knowledgeBaseRouter
  .route("/")
  .post(checkAuthentication, createknowledgeBaseValidation, createknowledgeBase)
  .get(
    checkAuthentication,
    createknowledgeBaseFilter,
    searchMiddelware,
    getAllknowledgeBases
  );

knowledgeBaseRouter
  .route("/:id")
  .put(checkAuthentication, updateknowledgeBaseValidation, updateknowledgeBase)
  .delete(
    checkAuthentication,
    deleteknowledgeBaseValidation,
    deleteknowledgeBase
  )
  .get(checkAuthentication, getknowledgeBaseValidation, getknowledgeBaseById);

module.exports = knowledgeBaseRouter;
