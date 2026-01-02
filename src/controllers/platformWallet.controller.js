const {
  walletHistoryV2SchemaModel,
  platformWalletModel,
} = require("../models/admin.model");
const asyncHandler = require("express-async-handler");
const { ApiError, ERROR_TYPES } = require("../../main/index");

const platformWalletFilterObject = asyncHandler((req, res, next) => {
  let filterObject = {};
  if (req.query.type && req.query.type !== "all") {
    const types = req.query.type.split(",").map((type) => type.trim());
    filterObject.type = { $in: types };
  }

  let now = new Date();

  let rangeDate = {};
  let endAt = req.query.end;
  let startAt = req.query.start;
  if (startAt) {
    rangeDate["$gte"] = startAt;
  }
  if (endAt) {
    rangeDate["$lte"] = endAt;
  }

  if (rangeDate["$gte"] || rangeDate["$gte"])
    filterObject["created_at"] = rangeDate;
  console.log(filterObject);
  req.filterObject = filterObject;
  return next();
});

const getAllPlatformWallet = asyncHandler(async (req, res, next) => {
  console.log({
    ...req.query,
    uid: "platform",
    ...req.app.locals.search,
  });


  const mongooseConnection = req.app.locals.mongooseConnection;

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  const years = req.query.year
    ? Array.isArray(req.query.year)
      ? req.query.year.map(Number)
      : [parseInt(req.query.year, 10)]
    : [];
  const months = req.query.month
    ? Array.isArray(req.query.month)
      ? req.query.month.map(Number)
      : [parseInt(req.query.month, 10)]
    : [];

  let dateFilter = null;

  if (years.length > 0) {
    const dateConditions = [];

    for (const year of years) {
      if (months.length > 0) {
        for (const month of months) {
          const startDate = new Date(year, month - 1, 1).getTime();
          const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

          dateConditions.push({
            created_at: { $gte: startDate, $lt: endDate },
          });
        }
      } else {
        const startOfYear = new Date(year, 0, 1).getTime();
        const endOfYear = new Date(year + 1, 0, 0, 23, 59, 59).getTime();

        dateConditions.push({
          created_at: { $gte: startOfYear, $lt: endOfYear },
        });
      }
    }

    dateFilter = { $or: dateConditions };
  }

  const walletHistoryCollection = walletHistoryV2SchemaModel(mongooseConnection);

  const walletHistoryPipeline = [
    {
      $match: {
        ...req.filterObject,
        uid: "platform",
        ...req.app.locals.search,
        ...(dateFilter || {}),
      },
    },
    { $sort: req.app.locals.sort || { created_at: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const summaryPipeline = [
    {
      $match: {
        ...req.filterObject,
        uid: "platform",
        ...(dateFilter || {}),
      },
    },
    {
      $group: {
        _id: null,
        money_in_of_list: {
          $sum: {
            $cond: [{ $eq: ["$amount_type", "incoming"] }, "$amount", 0],
          },
        },
        money_out_of_list: {
          $sum: {
            $cond: [{ $eq: ["$amount_type", "outcoming"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $addFields: {
        total_balance: {
          $subtract: ["$money_in_of_list", "$money_out_of_list"],
        },
      },
    },
  ];

  const countPipeline = [
    {
      $match: {
        ...req.filterObject,
        uid: "platform",
        ...req.app.locals.search,
        ...(dateFilter || {}),
      },
    },
    { $count: "totalCount" },
  ];

  try {
    const [walletHistory, summaryResult, countResult] = await Promise.all([
      walletHistoryCollection.aggregate(walletHistoryPipeline).exec(),
      walletHistoryCollection.aggregate(summaryPipeline).exec(),
      walletHistoryCollection.aggregate(countPipeline).exec(),
    ]);

    const count = countResult.length > 0 ? countResult[0].totalCount : 0;
    const summary = summaryResult.length > 0 ? summaryResult[0] : {};

    res.json({
      message: "success",
      page,
      limit,
      count: Math.ceil(count / limit),
      money_in: summary.money_in_of_list || 0,
      money_out: summary.money_out_of_list || 0,
      wallet_balance: summary.total_balance || 0,
      data: walletHistory,
    });
  } catch (error) {
    next(new ApiError(`Error fetching platform wallet data: ${error.message}`, 500));
  }
});





module.exports = {
  platformWalletFilterObject,
  getAllPlatformWallet,
};
