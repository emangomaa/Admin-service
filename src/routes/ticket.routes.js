const express = require("express");
const {
  createticket,
  updateticket,
  getticketById,
  getAlltickets,
  deleteticket,
  flowticket,
  createticketFilter,
} = require("../controllers/ticket.controller");

const {
  createticketValidation,
  updateticketValidation,
  deleteticketValidation,
  getticketValidation,
} = require("../validation/ticket.validation");
const { checkAuthentication, searchMiddelware } = require("../../main/index");
const getOwnerInfo = require("../methods/ticket/getOwnerInfo");
const getTicketInfo = require("../methods/ticket/getTicketInfo");
const getKnowledgeBase = require("../methods/ticket/getKnowledgeBase");
const createChat = require("../methods/ticket/createChat");
const ticketRouter = express.Router();

ticketRouter
  .route("/")
  .post(
    checkAuthentication,
    createticketValidation,
    getKnowledgeBase,
    getTicketInfo,
    getOwnerInfo,
    createticket,
    createChat
  )
  .get(
    checkAuthentication,
    createticketFilter,
    searchMiddelware,
    getAlltickets
  );

ticketRouter
  .route("/:id")
  .put(checkAuthentication, updateticketValidation, updateticket)
  .delete(checkAuthentication, deleteticketValidation, deleteticket)
  .get(checkAuthentication, getticketValidation, getticketById);

ticketRouter
  .route("/:id/:type")
  .put(checkAuthentication, updateticketValidation, flowticket);

module.exports = ticketRouter;
