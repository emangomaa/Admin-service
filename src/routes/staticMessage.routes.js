const express = require("express");
const {
  checkAuthentication,
  sortMiddelware,
  searchMiddelware,
} = require("../../main/index");
const {
  createStaticMessage,
  createStaticMessageFilter,
  getAllStaticMessages,
  deleteStaticMessage,
  getStaticMessageById,
} = require("../controllers/staticMessage.controller");
const {
  createStaticMessageValidation,
  getStaticMessageValidation,
} = require("../validation/staticMessage.validation");

const staticMessageRouter = express.Router();

staticMessageRouter
  .route("/")
  .post(checkAuthentication, createStaticMessageValidation, createStaticMessage)
  .get(
    checkAuthentication,
    searchMiddelware,
    sortMiddelware,
    createStaticMessageFilter,
    getAllStaticMessages
  );

staticMessageRouter
  .route("/:id")
  .patch(checkAuthentication, getStaticMessageValidation, deleteStaticMessage)
  .get(checkAuthentication, getStaticMessageValidation, getStaticMessageById);

module.exports = staticMessageRouter;
