// @desc Create Zone
// @route POST /api/v1/zone
// @access Private
const {
  ApiError,
  ERROR_TYPES,
  checkInZone,
  getNextSequenceValue,
  customLog,
} = require("../../main/index");
const asyncHandler = require("express-async-handler");
const {
  ticketModel,
  counterModel,
  adminModel,
} = require("../models/admin.model");

const createticketFilter = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const owner_type = req.query.owner_type || "all";
  const type = req.query.type || "all";

  let filterObject = {};
  if (owner_type != "all") {
    filterObject["owner_type"] = owner_type;
  }
  if (req.query.owner_id) {
    filterObject["owner_info.id"] = req.query.owner_id;
  }
  if (type == "all") {
  } else if (type == "ride") {
    filterObject["knowledgeBase.type"] = type;
  } else {
    filterObject["knowledgeBase.type"] = type;
  }
  req.filterObject = filterObject;
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  return next();
});

const createticket = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const sequenceName = "ticket_seq";
  const sequenceValue = await getNextSequenceValue(
    sequenceName,
    counterModel(mongooseConnection)
  );
  req.body.short_id = await sequenceValue.toString();
  req.body.created_at = Date.now();
  let ticket = ticketModel(mongooseConnection)(req.body);
  await ticket.save();
  req.app.locals.ticket = ticket;
  return next();
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
});
const flowticket = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const fb = req.app.locals.fbConnection;

  let { id, type } = req.params;
  let { admin_id } = req.body;
  let ticket = await ticketModel(mongooseConnection).findById(id);
  if (type == "assigned") {
    if (ticket.status != "new") {
      return next(
        new ApiError(
          "ticket_its_assigned",
          410,
          ERROR_TYPES.ticket_its_assigned
        )
      );
    } else {
      let now = new Date();
      let admin = await adminModel(mongooseConnection).findById(admin_id);
      let data = {
        assigned_info: {
          id: `${admin._id}`,
          name: admin.name || "",
          profile_picture: admin.profile_picture || "",
          email: admin.email || "",
        },
        status: "inProgress",
        assigned_at: now.getTime(),
      };
      let ticketUpdate = await ticketModel(
        mongooseConnection
      ).findByIdAndUpdate(id, data);
      customLog({
        data: `Done !!!`,
        req,
        onlyMsg: false,
      });
      res.json({ message: "success", data: ticketUpdate });
    }
  } else if (type == "resolved") {
    if (ticket.status != "inProgress") {
      return next(
        new ApiError(
          "ticket_its_resolved",
          410,
          ERROR_TYPES.ticket_its_resolved
        )
      );
    } else {
      let now = new Date();
      let ticketUpdate = await ticketModel(
        mongooseConnection
      ).findByIdAndUpdate(id, {
        resolved_at: now.getTime(),
        status: "resolved",
      });

      await fb
        .firestore()
        .collection("ticket_chat")
        .doc(ticket._id.toString())
        .set({ expired: new Date() }, { merge: true });
      customLog({
        data: `Done !!!`,
        req,
        onlyMsg: false,
      });
      res.json({ message: "success", data: ticketUpdate });
    }
  }
});
// ****************ticket update *******************************
const updateticket = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let ticket = await ticketModel(mongooseConnection).findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !ticket &&
    next(new ApiError("ticket_not_found", 410, ERROR_TYPES.ticket_not_found));
  ticket && res.json({ message: "success", data: ticket });
});
// **************** get ticket by id *******************************
const getticketById = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let ticket = await ticketModel(mongooseConnection).findById(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !ticket &&
    next(new ApiError("ticket_not_found", 410, ERROR_TYPES.ticket_not_found));
  ticket && res.json({ message: "success", data: ticket });
});
// **************** get all zones *******************************
const getAlltickets = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;
  const result = await ticketModel(mongooseConnection).aggregate([
    { $match: { ...req.filterObject, ...req.app.locals.search } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  // Extracting the results
  const tickets = result[0].data;
  const count = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  res.json({
    message: "success",
    page,
    limit,
    count: Math.ceil(count / limit),
    data: tickets,
  });
});

// **************** delete zone *******************************
const deleteticket = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  const mongooseConnection = req.app.locals.mongooseConnection;
  let { id } = req.params;
  let ticket = await ticketModel(mongooseConnection).findByIdAndDelete(id);
  customLog({
    data: `Done !!!`,
    req,
    onlyMsg: false,
  });
  !ticket &&
    next(
      new ApiError(
        "ticket_already_deleted",
        409,
        ERROR_TYPES.ticket_already_deleted
      )
    );
  ticket && res.json({ message: "success", data: ticket });
});

module.exports = {
  createticket,
  updateticket,
  getticketById,
  getAlltickets,
  deleteticket,
  flowticket,
  createticketFilter,
};
