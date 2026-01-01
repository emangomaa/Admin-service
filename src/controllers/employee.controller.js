const asyncHandler = require("express-async-handler");
const { ApiError, ERROR_TYPES } = require("../../main/index.js");
const { employeeModel, corporateModel } = require("../models/admin.model.js");

// @desc Create Admin
// @route POST /api/v1/admin/corporate/employee
// @access Private

// ****************** employee filter object ****************
const employeeFilter = asyncHandler(async (req, res, next) => {
  let filterObject = {};
  if (req.query.corporate) {
    filterObject["corporate_id"] = req.query.corporate;
  }
  if (req.query.voucher) {
    filterObject["voucher_details.voucher_id"] = req.query.voucher;
  }
  if (req.query.deleted && req.query.deleted === "true") {
    filterObject["deleted"] = true;
  } else {
    filterObject["deleted"] = false;
  }
  req.filterObject = filterObject;
  return next();
});
//************  create employee with admin   ************* */
const createEmployee = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  req.body.full_phone_number =
    req.body.code_phone_number + req.body.phone_number;
  let employee = employeeModel(mongooseConnection)(req.body);
  await employee.save();

  await corporateModel(mongooseConnection).findByIdAndUpdate(
    req.body.corporate_id,
    { $inc: { customers: 1 } } // Increment customers_count by 1
  );
  res.status(201).json({ message: "success", data: employee });
});

//************  get all employees   ************* */
const getAllEmployees = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 5;
  if (page <= 0) page = 1;
  let skip = (page - 1) * limit;
  let searchObject = {};

  if (req.query.keyword) {
    const keyword = req.query.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters
    const terms = keyword.split(" ").filter((term) => term); // Split keyword into terms

    // Create search conditions for each term
    const searchConditions = terms.map((term) => ({
      $or: [{ name: { $regex: new RegExp(keyword, "i") } }],
    }));

    // Combine search conditions with $and to ensure all terms are matched
    searchObject = { $and: searchConditions };
  }

  let employees = await employeeModel(mongooseConnection)
    .find({ ...req.filterObject, ...searchObject })
    .sort(req.app.locals.sort)
    .skip(skip)
    .limit(limit);

  let count = await employeeModel(mongooseConnection).countDocuments({
    ...req.filterObject,
    ...searchObject,
  });

  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: employees,
  });
});

// ***********************update employee *************************
const updateEmployee = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  if (req.body.phone_number || req.body.code_phone_number) {
    req.body.full_phone_number =
      req.body.code_phone_number + req.body.phone_number;
  }
  let updated = await employeeModel(mongooseConnection).findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    { new: true }
  );

  !updated &&
    new ApiError(" employee not found", 410, ERROR_TYPES.employee_not_found);
  updated && res.json({ message: "success", data: updated });
});

// **********************get employee by id *************************
const getEmployeeById = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await employeeModel(mongooseConnection).findById(id);
  !OneExist &&
    next(
      new ApiError(" employee not found", 410, ERROR_TYPES.employee_not_found)
    );
  OneExist && res.json({ message: "success", data: OneExist });
});

// ***********************delete employee ***************************
const deleteEmployee = asyncHandler(async (req, res, next) => {
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let OneExist = await employeeModel(mongooseConnection).findOneAndUpdate(
    { _id: id, deleted: false },
    { deleted: true },
    { new: true }
  );
  !OneExist &&
    next(
      new ApiError(
        " employee already deleted",
        409,
        ERROR_TYPES.employee_already_deleted
      )
    );

  await corporateModel(mongooseConnection).findByIdAndUpdate(
    req.body.corporate_id,
    { $inc: { customers: -1 } } // Increment customers_count by 1
  );
  OneExist && res.json({ message: "success", data: OneExist });
});

module.exports = {
  createEmployee,
  getEmployeeById,
  getAllEmployees,
  deleteEmployee,
  updateEmployee,
  employeeFilter,
};
