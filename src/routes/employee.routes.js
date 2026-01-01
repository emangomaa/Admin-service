const express = require("express");

const { checkAuthentication, sortMiddelware } = require("../../main/index");
const {
  createEmployee,
  getAllEmployees,
  employeeFilter,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
} = require("../controllers/employee.controller");
const employeeRouter = express.Router();

employeeRouter
  .route("/")
  .post(checkAuthentication, createEmployee)
  .get(checkAuthentication, employeeFilter, sortMiddelware, getAllEmployees);
employeeRouter
  .route("/:id")
  .put(checkAuthentication, updateEmployee)
  .delete(checkAuthentication, deleteEmployee)
  .get(checkAuthentication, getEmployeeById);

module.exports = employeeRouter;
