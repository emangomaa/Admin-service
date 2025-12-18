const express = require("express");
const { checkAuthentication } = require("../../main");
const {
  createPinPassword,
  logInWithPassowrd,
} = require("../controllers/pinPassword.controller");
const {
  setPasswordValidation,
  loginPasswordValidation,
} = require("../validation/pinPassword.validation");

const pinPasswordRouter = express.Router();

pinPasswordRouter
  .route("/")
  .post(checkAuthentication, setPasswordValidation, createPinPassword)
  .put(loginPasswordValidation, logInWithPassowrd);

module.exports = pinPasswordRouter;
