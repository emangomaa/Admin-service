const asyncHandler = require("express-async-handler");
const { ApiError, ERROR_TYPES } = require("../../main/index.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { customerModel, driverModel } = require("../models/admin.model.js");
const decryptPassword = require("../methods/functions/decryptPassword.js");

// *****************create pin password ***************
const createPinPassword = asyncHandler(async (req, res, next) => {
  let { password, iv, id, userType } = req.body;
  let mongooseConnection = req.app.locals.mongooseConnection;
  let fbConnection = req.app.locals.fbConnection;
  let key = "WwjKUTOxVE5vhjrA86DwLFQxH7XoKkKR";
  // 1- decrypt password
  let decrypted = decryptPassword(password, key, iv);
  console.log(decrypted);
  // 2- hash password
  const hash = bcrypt.hashSync(decrypted, 7);
  console.log("hash password", hash);

  // 3- store hash passowrd on mongo doc
  // 4- update user has passowrd true
  switch (userType) {
    case "customer":
      await customerModel(mongooseConnection).findByIdAndUpdate(id, {
        password: hash,
        has_password: true,
      });
      break;
    case "driver":
      await driverModel(mongooseConnection).findByIdAndUpdate(id, {
        password: hash,
        has_password: true,
      });
      break;

    default:
      break;
  }
  res.json({ message: "success" });
});

// *****************login with pin password ***************
const logInWithPassowrd = asyncHandler(async (req, res, next) => {
  let { password, iv, phoneNumber, userType } = req.body;
  let mongooseConnection = req.app.locals.mongooseConnection;
  let key = "WwjKUTOxVE5vhjrA86DwLFQxH7XoKkKR";
  let fbConnection = req.app.locals.fbConnection;
  // 1- decrypt password  this should be function
  let decrypted = decryptPassword(password, key, iv);

  // 2- compare passwordwith hash passowrd on claims
  let hashPassword = "";
  let matchPassword = "";
  switch (userType) {
    case "customer":
      let customer = await customerModel(mongooseConnection).findOne({
        full_phone_number: phoneNumber,
      });
      if (!customer) {
        return next(
          new ApiError(
            "customer not found",
            410,
            ERROR_TYPES.customer_not_found
          )
        );
      }
      hashPassword = customer.password;
      matchPassword = bcrypt.compareSync(decrypted, hashPassword);
      console.log(matchPassword);
      // 4- if true generate token else return error password
      if (matchPassword) {
        await fbConnection
          .auth()
          .createCustomToken(customer.fb_uid)
          .then((token) => {
            return res.json({
              status: "success",
              token: token,
            });
          });
      } else {
        return next(
          new ApiError(
            "incorrect credentials",
            400,
            ERROR_TYPES.incorrect_credentials
          )
        );
      }
      break;
    case "driver":
      let driver = await driverModel(mongooseConnection).findOne({
        full_phone_number: phoneNumber,
      });
       if (!driver) {
         return next(
           new ApiError(
             "driver not found",
             410,
             ERROR_TYPES.driver_not_found
           )
         );
       }
      console.log(driver);
      hashPassword = driver.password;
      matchPassword = bcrypt.compareSync(decrypted, hashPassword);
      // 4- if true generate token elde return error passord
      if (matchPassword) {
        await fbConnection
          .auth()
          .createCustomToken(driver.fb_uid)
          .then((token) => {
            return res.json({
              status: "success",
              token: token,
            });
          });
      } else {
        return next(
          new ApiError(
            "incorrect credentials",
            400,
            ERROR_TYPES.incorrect_credentials
          )
        );
      }
      break;

    default:
      break;
  }
});

module.exports = { createPinPassword, logInWithPassowrd };
