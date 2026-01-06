const {
  projectAnalysis,
  driverAnalysis,
  customLog,
  customerAnalysis,
  ApiError,
  ERROR_TYPES,
} = require("../../main");
const {
  driverModel,
  customerModel,
  adminModel,
  rideModel,
} = require("../models/admin.model");
const sendDriverEarningsEmail = require("../methods/functions/sendDriverEarningsEmail");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const puppeteer = require("puppeteer");
const asyncHandler = require("express-async-handler");
const getDriverAnalysis = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  try {
    const now = new Date();
    const startOfYasterday = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
    );

    const endOfYear = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    );

    console.log(
      `Fetching data rides between ${startOfYasterday} and ${endOfYasterday}`
    );
    let mongooseConnection = req.app.locals.mongooseConnection;
    let fbConnection = req.app.locals.fbConnection;

    // ***********************analysis for every driver *******************************
    const driverMetrics = await rideModel(mongooseConnection).aggregate([
      {
        $match: {
          status: "delivered",
          "driver_info.uid": { $exists: true, $ne: "" }, //
          completed_at: {
            $gte: startOfYasterday.getTime(),
            $lt: endOfYasterday.getTime(),
          },
        },
      },
      {
        $group: {
          _id: "$driver_info.uid", // Group by driver UID
          deliveredRides: { $sum: 1 }, // Count of rides
          totalDuration: {
            $sum: { $subtract: ["$completed_at", "$assigned_at"] },
          }, // Total duration
          totalDistance: { $sum: "$estimation_distance" }, // Total distance
          priceRides: { $sum: "$pay_info.total_ride" }, // Total distance
          totalEarnings: { $sum: "$pay_info.driver" }, // Total driver earnings
          companyPercentage: { $sum: "$pay_info.company" }, // Total driver earnings
        },
      },
    ]);

    console.log("Driver Metrics:", driverMetrics);

    // Update Firebase for each driver
    for (const driverMetric of driverMetrics) {
      const {
        _id: driverId,
        deliveredRides,
        totalDuration,
        totalDistance,
        priceRides,
        totalEarnings,
        companyPercentage,
      } = driverMetric;

      console.log(`Updating analysis for Driver ID: ${driverId}`);

      await driverAnalysis({
        fbConnection,
        data: {
          completeRides: deliveredRides,
          totalDuration: totalDuration,
          totalDistance: totalDistance,
          priceRides: priceRides,
          driverEarning: totalEarnings,
          companyPercentage,
        },
        id: driverId,
      });
    }

    // total rides fro every driver
    const totalRidesForDriverMetrices = await rideModel(
      mongooseConnection
    ).aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYasterday, $lt: endOfYasterday }, // Filter rides by date range
          "driver_info.uid": { $exists: true, $ne: "" }, //
        },
      },
      {
        $group: {
          _id: "$driver_info.uid", // Group by driver UID
          totalRides: { $sum: 1 }, // Count total rides
          dispatchRides: {
            $sum: { $cond: [{ $eq: ["$created_by", "dispatch"] }, 1, 0] },
          }, // Count dispatched rides
          scheduledRides: { $sum: { $cond: ["$schedule", 1, 0] } }, // Count scheduled rides
        },
      },
    ]);

    console.log("Driver Metrics:", totalRidesForDriverMetrices);

    // Update Firebase for each driver
    for (const driverMetric of totalRidesForDriverMetrices) {
      const {
        _id: driverId,
        totalRides,
        dispatchRides,
        scheduledRides,
      } = driverMetric;

      console.log(`Updating analysis for Driver ID: ${driverId}`);

      await driverAnalysis({
        fbConnection,
        data: {
          totalRide: totalRides,
          dispatchRides,
          scheduledRides,
        },
        id: driverId,
      });
    }

    const cancelRidesForDriverMetrices = await rideModel(
      mongooseConnection
    ).aggregate([
      {
        $match: {
          status: "canceled",
          canceled_at: {
            $gte: startOfYasterday.getTime(),
            $lt: endOfYasterday.getTime(),
          }, // Filter rides by date range
          "driver_info.uid": { $exists: true, $ne: "" }, //
        },
      },
      {
        $group: {
          _id: "$driver_info.uid", // Group by driver UID
          canceledRides: {
            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
          }, // Count canceled rides
        },
      },
    ]);

    // Update Firebase for each driver
    for (const driverMetric of cancelRidesForDriverMetrices) {
      const { _id: driverId, canceledRides } = driverMetric;

      console.log(`Updating analysis for Driver ID: ${driverId}`);

      await driverAnalysis({
        fbConnection,
        data: {
          cancelRides: canceledRides,
        },
        id: driverId,
      });
    }
    res.json({ message: "success" });
  } catch (error) {
    console.error("Error aggregating rides per driver:", error);
  }
});

const getDashboardAnalysis = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  try {
    const now = new Date();

    const startOfYasterday = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
    );

    const endOfYasterday = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    );

    console.log(
      `Fetching dashboard analysis between ${startOfYasterday} and ${endOfYasterday}`
    );
    let mongooseConnection = req.app.locals.mongooseConnection;
    const fbConnection = req.app.locals.fbConnection;
    // Fetch drivers created today
    const driversCreatedToday = await driverModel(mongooseConnection).find({
      createdAt: { $gte: startOfYasterday, $lt: endOfYasterday },
    });

    const totalDriversCreatedToday = driversCreatedToday.length;

    console.log(`Total Drivers Created Today: ${totalDriversCreatedToday}`);

    // ********************************** customers *****************************
    // Fetch customers created yesterday
    const customersCreatedYesterday = await customerModel(
      mongooseConnection
    ).find({
      createdAt: { $gte: startOfYasterday, $lt: endOfYasterday },
    });

    const totalCustomersCreatedYesterday = customersCreatedYesterday.length;

    console.log(
      `Total Customers Created Yesterday: ${totalCustomersCreatedYesterday}`
    );

    //************************************************admins  */
    // Fetch admins created yesterday
    const adminsCreatedYesterday = await adminModel(mongooseConnection).find({
      createdAt: { $gte: startOfYasterday, $lt: endOfYasterday },
    });

    const totalAdminsCreatedYesterday = adminsCreatedYesterday.length;

    console.log(
      `Total Admins Created Yesterday: ${totalAdminsCreatedYesterday}`
    );

    // ************************rides ***********************************
    // Fetch all rides created yesterday
    const ridesCreatedYesterday = await rideModel(mongooseConnection).find({
      createdAt: {
        $gte: startOfYasterday,
        $lt: endOfYasterday,
      },
    });

    const totalRidesCreatedYesterday = ridesCreatedYesterday.length;
    // Separate rides by type
    const ridesByDispatcher = ridesCreatedYesterday.filter(
      (ride) => ride.created_by === "dispatch"
    ).length;
    const ridesByCustomer = ridesCreatedYesterday.filter(
      (ride) => ride.created_by === "customer"
    ).length;
    const scheduledRides = ridesCreatedYesterday.filter(
      (ride) => ride.schedule === true
    ).length;

    console.log(`Total Rides Created Yesterday: ${totalRidesCreatedYesterday}`);
    console.log(`Rides Created by Dispatcher: ${ridesByDispatcher}`);
    console.log(`Rides Created by Customer: ${ridesByCustomer}`);
    console.log(`Scheduled Rides: ${scheduledRides}`);

    // Aggregation pipeline for delivered rides
    const deliveredRidesMetrics = await rideModel(mongooseConnection).aggregate(
      [
        {
          $match: {
            status: "delivered",
            completed_at: {
              $gte: startOfYasterday.getTime(),
              $lt: endOfYasterday.getTime(),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDuration: {
              $sum: { $subtract: ["$completed_at", "$assigned_at"] },
            },
            deliveredRides: { $sum: 1 }, // Count of rides
            totalDistance: { $sum: "$estimation_distance" },
            totalPrice: { $sum: "$pay_info.total_ride" },
            totalCompanyPercentage: { $sum: "$pay_info.company" },
            totalDriversEarning: { $sum: "$pay_info.driver" },
          },
        },
      ]
    );
    const canceledRidesMetrics = await rideModel(mongooseConnection).aggregate([
      {
        $match: {
          status: "canceled",
          canceled_at: {
            $gte: startOfYasterday.getTime(),
            $lt: endOfYasterday.getTime(),
          },
        },
      },
      {
        $group: {
          _id: null,

          canceledRides: { $sum: 1 }, // Count of rides
        },
      },
    ]);

    const metrics = deliveredRidesMetrics[0] || {
      totalDuration: 0,
      deliveredRides: 0,
      totalDistance: 0,
      totalPrice: 0,
      totalCompanyPercentage: 0,
      totalDriversEarning: 0,
    };
    const metricscanceled = canceledRidesMetrics[0] || {
      canceledRides: 0,
    };

    console.log("Delivered Rides Metrics:", metrics);

    // Firebase update
    await projectAnalysis({
      fbConnection,
      data: {
        totalDriver: totalDriversCreatedToday,
        totalCustomer: totalCustomersCreatedYesterday,
        totalDispatch: totalAdminsCreatedYesterday,
        totalRide: totalRidesCreatedYesterday,
        cancelRides: metricscanceled.canceledRides,
        completeRides: metrics.deliveredRides,
        scheduledRides: scheduledRides,
        dispatchRides: ridesByDispatcher,
        totalDuration: metrics.totalDuration,
        totalDistance: metrics.totalDistance,
        priceRides: metrics.totalPrice,
        companyPercentage: metrics.totalCompanyPercentage,
        driverEarning: metrics.totalDriversEarning,
      },
    });

    next();
  } catch (error) {
    console.error("Error aggregating dashboard analysis:", error);
  }
});
const getDashboardYearlyData = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  try {
    const now = new Date();
    let { year } = req.body;
    if (!year) {
      return next(
        new ApiError("year required!", 400, ERROR_TYPES.year_required)
      );
    }
    const startOfYear = new Date(year, 0, 1, 0, 0, 0); // January 1st, 00:00:00 UTC
    const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st, 23:59:59 UTC

    console.log(
      `Fetching dashboard analysis between ${startOfYear} and ${endOfYear}`
    );
    let mongooseConnection = req.app.locals.mongooseConnection;
    const fbConnection = req.app.locals.fbConnection;
    // Fetch drivers created today
    const driversCreatedToday = await driverModel(mongooseConnection).find({
      createdAt: { $gte: startOfYear, $lt: endOfYear },
      deleted: false,
      account_status: 'accept'
    });

    const totalDriversCreatedToday = driversCreatedToday.length;
    // res.json({driversCreatedToday:driversCreatedToday})

    console.log(`Total Drivers Created Today: ${totalDriversCreatedToday}`);

    // ********************************** customers *****************************
    // Fetch customers created yesterday
    const customersCreatedYesterday = await customerModel(
      mongooseConnection
    ).find({
      createdAt: { $gte: startOfYear, $lt: endOfYear },
      deleted: false,
      created_at: { $exists: true }
    });

    console.log(customersCreatedYesterday)
    const totalCustomersCreatedYesterday = customersCreatedYesterday.length;
    console.log(
      `Total Customers Created Yesterday: ${totalCustomersCreatedYesterday}`
    );

    //************************************************admins  */
    // Fetch admins created yesterday
    const adminsCreatedYesterday = await adminModel(mongooseConnection).find({
      createdAt: { $gte: startOfYear, $lt: endOfYear },
    });

    const totalAdminsCreatedYesterday = adminsCreatedYesterday.length;

    console.log(
      `Total Admins Created Yesterday: ${totalAdminsCreatedYesterday}`
    );

    // ************************rides ***********************************
    // Fetch all rides created yesterday
    const ridesCreatedYesterday = await rideModel(mongooseConnection).find({
      createdAt: {
        $gte: startOfYear,
        $lt: endOfYear,
      },
    });

    const totalRidesCreatedYesterday = ridesCreatedYesterday.length;
    // Separate rides by type
    const ridesByDispatcher = ridesCreatedYesterday.filter(
      (ride) => ride.created_by === "dispatch"
    ).length;
    const ridesByCustomer = ridesCreatedYesterday.filter(
      (ride) => ride.created_by === "customer"
    ).length;
    const scheduledRides = ridesCreatedYesterday.filter(
      (ride) => ride.schedule === true
    ).length;

    console.log(`Total Rides Created Yesterday: ${totalRidesCreatedYesterday}`);
    console.log(`Rides Created by Dispatcher: ${ridesByDispatcher}`);
    console.log(`Rides Created by Customer: ${ridesByCustomer}`);
    console.log(`Scheduled Rides: ${scheduledRides}`);

    // Aggregation pipeline for delivered rides
    const deliveredRidesMetrics = await rideModel(mongooseConnection).aggregate(
      [
        {
          $match: {
            status: "delivered",
            completed_at: {
              $gte: startOfYear.getTime(),
              $lt: endOfYear.getTime(),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDuration: {
              $sum: { $subtract: ["$completed_at", "$assigned_at"] },
            },
            deliveredRides: { $sum: 1 }, // Count of rides
          },
        },
      ]
    );
    const canceledRidesMetrics = await rideModel(mongooseConnection).aggregate([
      {
        $match: {
          status: "canceled",
          canceled_at: {
            $gte: startOfYear.getTime(),
            $lt: endOfYear.getTime(),
          },
        },
      },
      {
        $group: {
          _id: null,
          canceledRides: { $sum: 1 }, // Count of rides
        },
      },
    ]);

    const metrics = deliveredRidesMetrics[0] || {
      deliveredRides: 0,
    };
    const metricscanceled = canceledRidesMetrics[0] || {
      canceledRides: 0,
    };

    console.log("Delivered Rides Metrics:", metrics);

    // Firebase update
    res.json({
      message: "success",
      data: {
        totalDriver: totalDriversCreatedToday,
        totalCustomer: totalCustomersCreatedYesterday,
        totalDispatch: totalAdminsCreatedYesterday,
        totalRide: totalRidesCreatedYesterday,
        cancelRides: metricscanceled.canceledRides,
        completeRides: metrics.deliveredRides,
        scheduledRides: scheduledRides,
        dispatchRides: ridesByDispatcher,
      },
    });
  } catch (error) {
    console.error("Error aggregating dashboard analysis:", error);
  }
});

const getDashboardRevenue = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });

  try {
    let { date, period } = req.body;
    if (!date || !period) {
      return res.status(400).json({ message: "Date and period are required." });
    }

    // Convert the user's local date to UTC
    const userDate = new Date(date);
    const userYear = userDate.getFullYear();
    const userMonth = userDate.getMonth() + 1; // JS months are 0-based
    const userDay = userDate.getDate();
    const userWeekday = userDate.getDay(); // 0 (Sunday) - 6 (Saturday)
    const userQuarter = Math.ceil(userMonth / 3);

    let startDate, endDate, length, groupBy;

    if (period === "monthly") {
      // Get months up to the provided user date
      startDate = new Date(userYear, 0, 1, 0, 0, 0); // Start of year in user's timezone
      endDate = new Date(userYear, userMonth - 1, 31, 23, 59, 59); // End of last completed month
      length = userMonth; // Months up to now
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        month: { $month: { $toDate: "$completed_at" } },
      };
    } else if (period === "daily") {
      // Get weekdays from the start of the current week until the given date
      const startOfWeek = new Date(userDate);
      startOfWeek.setDate(userDay - userWeekday);
      startOfWeek.setHours(0, 0, 0, 0);

      startDate = startOfWeek;
      endDate = userDate;
      length = userWeekday + 1; // Days until the provided date in the current week
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        month: { $month: { $toDate: "$completed_at" } },
        day: { $dayOfMonth: { $toDate: "$completed_at" } },
      };
    } else if (period === "quarterly") {
      // Get quarters up to the provided date
      startDate = new Date(userYear, 0, 1, 0, 0, 0);
      endDate = new Date(userYear, userQuarter * 3 - 1, 31, 23, 59, 59);
      length = userQuarter; // Quarters until now
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        quarter: {
          $ceil: { $divide: [{ $month: { $toDate: "$completed_at" } }, 3] },
        },
      };
    } else {
      return res.status(400).json({
        message: "Invalid period. Choose 'monthly', 'daily', or 'quarterly'.",
      });
    }

    console.log(
      `Fetching dashboard analysis between ${startDate} and ${endDate}`
    );

    let mongooseConnection = req.app.locals.mongooseConnection;

    // Aggregation pipeline for delivered rides grouped by the selected period
    const revenueMetrics = await rideModel(mongooseConnection).aggregate([
      {
        $match: {
          status: "delivered",
          completed_at: {
            $gte: startDate.getTime(),
            $lt: endDate.getTime(),
          },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalCompanyPercentage: { $sum: "$pay_info.company" },
          // totalDriversEarning: { $sum: "$pay_info.driver" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by period
      },
    ]);

    // Format the response based on the period
    const formattedData = Array.from({ length }, (_, index) => {
      let key;
      if (period === "monthly") {
        key = index + 1; // Month number (1-12)
      } else if (period === "daily") {
        key = index; // Day index in the week (0-Sunday, 6-Saturday)
      } else if (period === "quarterly") {
        key = index + 1; // Quarter number (1-4)
      }

      const periodData = revenueMetrics.find((d) => {
        if (period === "monthly") return d._id.month === key;
        if (period === "daily")
          return d._id.day === userDate.getDate() - (userWeekday - key);
        if (period === "quarterly") return d._id.quarter === key;
      });

      return {
        period: key,
        companyPercentage: periodData?.totalCompanyPercentage || 0,
        // driverEarning: periodData?.totalDriversEarning || 0,
      };
    });
    let sumCompanyPercentage;
    sumCompanyPercentage = revenueMetrics.reduce(
      (sum, d) => sum + (d.totalCompanyPercentage || 0),
      0
    );
    console.log(`Delivered Rides Metrics (${period}):`, formattedData);

    res.json({
      message: "success",
      sumCompanyPercentage,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error aggregating dashboard analysis:", error);
    res.status(500).json({ message: "Error in fetching data", error });
  }
});
const getDashboardDriverEarnings = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });

  try {
    let { date, period } = req.body;
    if (!date || !period) {
      return res.status(400).json({ message: "Date and period are required." });
    }

    // Convert the user's local date to UTC
    const userDate = new Date(date);
    const userYear = userDate.getFullYear();
    const userMonth = userDate.getMonth() + 1; // JS months are 0-based
    const userDay = userDate.getDate();
    const userWeekday = userDate.getDay(); // 0 (Sunday) - 6 (Saturday)
    const userQuarter = Math.ceil(userMonth / 3);

    let startDate, endDate, length, groupBy;

    if (period === "monthly") {
      // Get months up to the provided user date
      startDate = new Date(userYear, 0, 1, 0, 0, 0); // Start of year in user's timezone
      endDate = new Date(userYear, userMonth - 1, 31, 23, 59, 59); // End of last completed month
      length = userMonth; // Months up to now
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        month: { $month: { $toDate: "$completed_at" } },
      };
    } else if (period === "daily") {
      // Get weekdays from the start of the current week until the given date
      const startOfWeek = new Date(userDate);
      startOfWeek.setDate(userDay - userWeekday);
      startOfWeek.setHours(0, 0, 0, 0);

      startDate = startOfWeek;
      endDate = userDate;
      length = userWeekday + 1; // Days until the provided date in the current week
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        month: { $month: { $toDate: "$completed_at" } },
        day: { $dayOfMonth: { $toDate: "$completed_at" } },
      };
    } else if (period === "quarterly") {
      // Get quarters up to the provided date
      startDate = new Date(userYear, 0, 1, 0, 0, 0);
      endDate = new Date(userYear, userQuarter * 3 - 1, 31, 23, 59, 59);
      length = userQuarter; // Quarters until now
      groupBy = {
        year: { $year: { $toDate: "$completed_at" } },
        quarter: {
          $ceil: { $divide: [{ $month: { $toDate: "$completed_at" } }, 3] },
        },
      };
    } else {
      return res.status(400).json({
        message: "Invalid period. Choose 'monthly', 'daily', or 'quarterly'.",
      });
    }

    console.log(
      `Fetching dashboard analysis between ${startDate} and ${endDate}`
    );

    let mongooseConnection = req.app.locals.mongooseConnection;

    // Aggregation pipeline for delivered rides grouped by the selected period
    const driverEarningMetrics = await rideModel(mongooseConnection).aggregate([
      {
        $match: {
          status: "delivered",
          completed_at: {
            $gte: startDate.getTime(),
            $lt: endDate.getTime(),
          },
        },
      },
      {
        $group: {
          _id: groupBy,
          // totalCompanyPercentage: { $sum: "$pay_info.company" },
          totalDriversEarning: { $sum: "$pay_info.driver" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by period
      },
    ]);

    // Format the response based on the period
    const formattedData = Array.from({ length }, (_, index) => {
      let key;
      if (period === "monthly") {
        key = index + 1; // Month number (1-12)
      } else if (period === "daily") {
        key = index; // Day index in the week (0-Sunday, 6-Saturday)
      } else if (period === "quarterly") {
        key = index + 1; // Quarter number (1-4)
      }

      const periodData = driverEarningMetrics.find((d) => {
        if (period === "monthly") return d._id.month === key;
        if (period === "daily")
          return d._id.day === userDate.getDate() - (userWeekday - key);
        if (period === "quarterly") return d._id.quarter === key;
      });

      return {
        period: key,
        // companyPercentage: periodData?.totalCompanyPercentage || 0,
        driverEarning: periodData?.totalDriversEarning || 0,
      };
    });

    let sumDriverEarnings;
    sumDriverEarnings = driverEarningMetrics.reduce(
      (sum, d) => sum + (d.totalDriversEarning || 0),
      0
    );
    console.log(`Delivered Rides Metrics (${period}):`, formattedData);

    res.json({
      message: "success",
      sumDriverEarnings,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error aggregating dashboard analysis:", error);
    res.status(500).json({ message: "Error in fetching data", error });
  }
});
const getDashboardRides = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });

  try {
    let { date, period } = req.body;
    if (!date || !period) {
      return res.status(400).json({ message: "Date and period are required." });
    }

    // Convert user's local date to JavaScript Date object
    const userDate = new Date(date);
    const userYear = userDate.getFullYear();
    const userMonth = userDate.getMonth() + 1; // JS months are 0-based
    const userDay = userDate.getDate();
    const userWeekday = userDate.getDay(); // 0 (Sunday) - 6 (Saturday)
    const userQuarter = Math.ceil(userMonth / 3);

    let startDate, endDate, length, groupBy;

    if (period === "monthly") {
      startDate = new Date(userYear, 0, 1, 0, 0, 0);
      endDate = new Date(userYear, userMonth, 0, 23, 59, 59);
      length = userMonth;
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    } else if (period === "daily") {
      const startOfWeek = new Date(userDate);
      startOfWeek.setDate(userDay - userWeekday);
      startOfWeek.setHours(0, 0, 0, 0);

      startDate = startOfWeek;
      endDate = new Date(userYear, userMonth - 1, userDay, 23, 59, 59); // End of user-selected day
      length = userWeekday + 1;
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    } else if (period === "quarterly") {
      startDate = new Date(userYear, 0, 1, 0, 0, 0);
      endDate = new Date(userYear, userQuarter * 3, 0, 23, 59, 59);
      length = userQuarter;
      groupBy = {
        year: { $year: "$createdAt" },
        quarter: {
          $ceil: { $divide: [{ $month: "$createdAt" }, 3] },
        },
      };
    } else {
      return res.status(400).json({
        message: "Invalid period. Choose 'monthly', 'daily', or 'quarterly'.",
      });
    }

    console.log(
      `Fetching dashboard analysis between ${startDate} and ${endDate}`
    );

    let mongooseConnection = req.app.locals.mongooseConnection;

    // Aggregation pipeline for total rides and driver earnings
    const totalRidesMetrics = await rideModel(mongooseConnection).aggregate(
      [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: groupBy,
            totalRides: { $sum: 1 }, // Count total rides
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]
    );

    const formattedData = Array.from({ length }, (_, index) => {
      let key;
      if (period === "monthly") {
        key = index + 1; // Month number (1-12)
      } else if (period === "daily") {
        key = index; // Day index in the week (0-Sunday, 6-Saturday)
      } else if (period === "quarterly") {
        key = index + 1; // Quarter number (1-4)
      }

      const periodData = totalRidesMetrics.find((d) => {
        if (period === "monthly") return d._id.month === key;
        if (period === "daily")
          return d._id.day === userDate.getDate() - (userWeekday - key);
        if (period === "quarterly") return d._id.quarter === key;
      });
      return {
        period: key,
        totalRides: periodData?.totalRides || 0,
      };
    });

    let sumTotalRides;
    sumTotalRides = totalRidesMetrics.reduce(
      (sum, d) => sum + (d.totalRides || 0),
      0
    );
    console.log(`Delivered Rides Metrics (${period}):`, formattedData);

    res.json({
      message: "success",
      sumTotalRides,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error aggregating dashboard analysis:", error);
    res.status(500).json({ message: "Error in fetching data", error });
  }
});

const generatePdfBuffer = async (html) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html);

    // Generate a unique file name for each PDF
    const tempDir = path.join(__dirname, "./temp");
    const fileName = `outputReport-${Date.now()}.pdf`; // Timestamp ensures uniqueness
    const filePath = path.join(tempDir, fileName);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true }); // Create the directory if it doesn't exist
    }
    // Save the PDF to the unique file path
    await page.pdf({
      format: "A4",
      path: filePath, // Save to a unique file path
    });

    return filePath; // Return the unique file path
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    await browser.close(); // Ensure the browser is closed only after all operations
  }
};

const uploadPdfToFirebase = async (
  fbConnection,
  filePath,
  fileName,
  driverId
) => {
  const bucket = fbConnection.storage().bucket();
  const firebaseFilePath = `driversTaxEmails/${driverId}/${fileName}`;
  const firebaseFile = bucket.file(firebaseFilePath);

  return new Promise((resolve, reject) => {
    // Create a read stream for the file
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found at ${filePath}`);
    }
    const readStream = fs.createReadStream(filePath);

    // Create a write stream to upload to Firebase Storage
    const writeStream = firebaseFile.createWriteStream({
      contentType: "application/pdf",
      metadata: {
        contentType: "application/pdf",
      },
    });

    // Pipe the read stream to the write stream
    readStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      try {
        // Make the file public
        await firebaseFile.makePublic();

        // Generate the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;
        console.log("PDF uploaded and made public:", publicUrl);

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error removing file:", err);
            // Optionally reject if you want to treat this as a critical error
          } else {
            console.log("Temporary file removed:", filePath);
          }
        });
        resolve(publicUrl);
      } catch (error) {
        console.error("Error making file public:", error);
        reject(error);
      }
    });

    writeStream.on("error", (error) => {
      console.error("Error uploading PDF to Firebase Storage:", error);
      reject(error);
    });
  });
};

const sendEarningsEmail = asyncHandler(async (req, res, next) => {
  let { statistics, driver } = req.body;
  let date = new Date().toString();
  let fbConnection = req.app.locals.fbConnection;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Driver Earning Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
        }
        .box {
            background: #FFF;
            border-radius: 16px;
            box-shadow: rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px;
            padding: 20px;
 
        }
        h1, h3, h4 {
            margin: 0;
            font-weight: 600;
            color: #1F2937;
        }
        p, li {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
            line-height: 1.6;
        }
        .bold {
            font-weight: 700;
            color: #1F2937;
            font-size: 14;
        }
        .small {
            font-size: 11px;
            font-weight: 600;
            color: #19213D;
        }
        .flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .rounded {
            border-radius: 50%;
        }
        .shadow {
          box-shadow: rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px;        }
    </style>
</head>
<body>
    <!-- First Section: Driver Earning Report -->
  <div style="background: linear-gradient(168deg, #ffffff 30%, #f0ebfd 70%), linear-gradient(497deg, #ffffff 109%, #f0ebfd 100%);max-width: 690px;margin: auto;padding: 50px 0 20px 0;">
      <div class="container">
          <div class="flex" style="margin-bottom: 20px;">
              <div>
                  <p style="color: #19213D; font-size: 27px;font-weight: 700;">Driver Earning Report</p>
                  <p style="color: #19213D; font-size: 12px;font-weight: 500;">For the Year Ending: ${statistics.year}</p>
              </div>
              <svg width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="78" height="78">
                <path d="M0 0H78V78H0V0Z" fill="white"/>
                </mask>
                <g mask="url(#mask0_13892_44133)">
                <mask id="mask1_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="-8" y="-8" width="94" height="94">
                <path d="M9.34666 -7.48828L85.4915 9.34795L68.6553 85.4915L-7.48828 68.6566L9.34666 -7.48828Z" fill="white"/>
                </mask>
                <g mask="url(#mask1_13892_44133)">
                <mask id="mask2_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="-1" y="0" width="79" height="78">
                <path d="M47.4128 0.927717C26.3868 -3.72102 5.57293 9.55539 0.9242 30.5814C-3.72582 51.6087 9.55187 72.4226 30.5779 77.0713C51.6052 81.7213 72.419 68.4436 77.0678 47.4176C81.7165 26.3903 68.4401 5.57645 47.4128 0.927717Z" fill="white"/>
                </mask>
                <g mask="url(#mask2_13892_44133)">
                <path d="M9.34275 -7.48828L85.4876 9.34795L68.6514 85.4915L-7.49219 68.6566L9.34275 -7.48828Z" fill="#FDF9F7"/>
                </g>
                </g>
                </g>
                <mask id="mask3_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="2" y="1" width="74" height="76">
                <path d="M2.30078 1.64844H75.6932V76.3573H2.30078V1.64844Z" fill="white"/>
                </mask>
                <g mask="url(#mask3_13892_44133)">
                <mask id="mask4_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="1" y="0" width="76" height="78">
                <path d="M76.8967 74.8939L3.88103 77.5191L1.20312 3.02235L74.2188 0.398438L76.8967 74.8939Z" fill="white"/>
                </mask>
                <g mask="url(#mask4_13892_44133)">
                <mask id="mask5_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="1" y="0" width="76" height="78">
                <path d="M76.9006 74.8939L3.88494 77.5191L1.20703 3.02235L74.2227 0.398438L76.9006 74.8939Z" fill="white"/>
                </mask>
                <g mask="url(#mask5_13892_44133)">
                <path d="M75.4124 36.1788C75.7287 42.4204 74.3942 48.3329 71.7793 53.9676C70.3755 56.9901 68.5692 59.7644 66.4312 62.3343C63.1285 66.3068 59.2049 69.4977 54.6436 71.9056C51.3447 73.6476 47.8556 74.8882 44.1813 75.522C42.1385 75.8743 40.0661 76.2188 37.9783 76.1096C36.5693 76.0337 35.1577 76.0093 33.7461 75.8833C29.807 75.5349 26.1148 74.4074 22.5588 72.758C19.9195 71.5328 17.5167 69.931 15.2617 68.0938C13.773 66.8802 12.445 65.5149 11.1928 64.0673C10.8457 63.6662 10.8033 63.1815 11.1221 62.9283C11.5271 62.6082 11.9115 62.7046 12.2483 63.0646C12.9348 63.7974 13.6033 64.543 14.3245 65.2437C18.3678 69.1789 23.1039 71.9005 28.5343 73.4136C30.6555 74.0037 32.8089 74.3868 35.015 74.5283C36.1682 74.6015 37.3252 74.6825 38.4733 74.6813C39.6997 74.6813 40.9326 74.5077 42.1552 74.347C44.5284 74.0333 46.8554 73.4972 49.1129 72.6963C52.9466 71.3361 56.4743 69.4231 59.6664 66.8815C61.5151 65.4095 63.2507 63.8231 64.7908 62.0361C67.623 58.7488 69.8419 55.0835 71.4284 51.0403C72.3771 48.6234 73.0598 46.1383 73.4918 43.5787C73.6666 42.5451 73.7514 41.5037 73.8736 40.4663C74.1821 37.8462 74.1127 35.221 73.7232 32.6408C73.1768 29.0373 72.1702 25.5404 70.5593 22.239C69.2994 19.6562 67.7708 17.2509 65.9144 15.0615C63.7289 12.4839 61.2155 10.2855 58.3487 8.47924C54.6256 6.1343 50.6119 4.58258 46.2807 3.82022C43.4074 3.31498 40.5109 3.108 37.6145 3.38697C32.3474 3.89479 27.3747 5.41565 22.7851 8.08327C19.7999 9.81883 17.1117 11.9259 14.6935 14.4046C11.2867 17.895 8.70261 21.9022 6.83206 26.3838C5.47189 29.6441 4.61697 33.0484 4.25572 36.5593C4.08473 38.2203 3.99345 39.898 4.06545 41.5719C4.23643 45.5431 4.92809 49.4153 6.38339 53.132C6.47466 53.366 6.58265 53.5974 6.63922 53.8391C6.71507 54.1566 6.68679 54.5153 6.32939 54.6027C5.99771 54.6837 5.57474 54.9023 5.32405 54.3893C4.93194 53.5884 4.63368 52.7489 4.37013 51.9043C3.70934 49.792 3.1591 47.6489 2.91355 45.4415C2.65514 43.1262 2.4713 40.7928 2.61015 38.4723C3.02025 31.6059 5.05793 25.237 8.78489 19.4338C10.325 17.0388 12.1005 14.8198 14.1343 12.831C17.8587 9.18889 22.1166 6.34128 26.9813 4.42317C29.3056 3.50782 31.6943 2.83031 34.1408 2.36492C36.7107 1.87511 39.3295 1.7414 41.9251 1.83782C46.5353 2.01009 50.9655 3.09129 55.1604 5.03897C57.9206 6.31943 60.4725 7.93929 62.8046 9.90368C68.5049 14.7041 72.2589 20.7413 74.2271 27.9021C74.5999 29.2545 74.8468 30.6456 75.1026 32.0263C75.352 33.3955 75.3507 34.7903 75.4124 36.1788Z" fill="#5E17EB"/>
                </g>
                </g>
                </g>
                <mask id="mask6_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="4" y="4" width="70" height="70">
                <path d="M4.27734 4.28516H73.7204V73.7282H4.27734V4.28516Z" fill="white"/>
                </mask>
                <g mask="url(#mask6_13892_44133)">
                <mask id="mask7_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="78" height="78">
                <path d="M0.703125 69.1357L8.86026 0.707031L77.2889 8.86417L69.1318 77.2928L0.703125 69.1357Z" fill="white"/>
                </mask>
                <g mask="url(#mask7_13892_44133)">
                <mask id="mask8_13892_44133" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="4" y="4" width="70" height="70">
                <path d="M4.78074 34.9152C2.52837 53.811 16.0207 70.9558 34.9165 73.2082C53.8123 75.4605 70.9558 61.9681 73.2081 43.0724C75.4605 24.1766 61.9694 7.03313 43.0736 4.78076C24.1779 2.52839 7.03311 16.0195 4.78074 34.9152Z" fill="white"/>
                </mask>
                <g mask="url(#mask8_13892_44133)">
                <path d="M0.699219 69.1318L8.85636 0.703125L77.285 8.86026L69.1279 77.2889L0.699219 69.1318Z" fill="#5E17EB"/>
                </g>
                </g>
                </g>
                <path d="M17.0709 40.6637L19.6421 29.2373C19.709 28.9442 19.709 28.6613 19.6833 28.4505C19.565 27.5094 18.7988 27.0929 18.0326 27.1855C17.3075 27.278 16.6235 27.8591 16.3973 28.9082L14.0112 39.5324C13.6307 41.1522 12.4325 42.5355 11.3732 42.6692C10.9258 42.7207 10.6275 42.443 10.5709 41.9904C10.5504 41.8156 10.5452 41.615 10.5967 41.3888L13.1216 30.0549C13.1833 29.7618 13.1884 29.4995 13.1576 29.2887C13.0444 28.3476 12.2525 27.9105 11.4914 28.0082C10.7664 28.0957 10.0824 28.6768 9.85615 29.7258L7.31066 41.3476C7.20781 41.795 7.19752 42.2321 7.24895 42.6435C7.48036 44.4845 9.13107 45.5747 11.0698 45.333C12.3656 45.1684 13.6667 44.4125 14.5203 43.3275C15.3071 44.2068 16.639 44.6336 18.1251 44.4485C20.4186 44.1605 23.1133 42.4687 23.8641 39.0901L26.2656 28.4042C26.3273 28.1162 26.3324 27.8334 26.3067 27.6226C26.1884 26.6815 25.4222 26.2598 24.656 26.3575C23.9309 26.4501 23.247 27.0312 23.0207 28.0751L20.6295 38.8587C20.2078 40.7665 19.0508 41.8259 18.0531 41.9493C17.4875 42.0213 17.0864 41.7333 17.0247 41.2448C16.9989 41.0648 17.0195 40.89 17.0709 40.6637Z" fill="#FDF9F7"/>
                <path d="M34.2075 38.2608C34.2127 38.2814 34.1715 37.9728 34.0533 37.6077C34.1767 37.4946 34.295 37.3197 34.3875 37.1243C34.6549 36.5947 35.0355 34.8154 34.9378 34.0338C34.6858 32.0334 32.8757 30.9123 30.757 31.1797C28.916 31.4111 27.3013 32.6453 26.8899 34.4606L25.9643 38.6773C25.846 39.1864 25.8306 39.6904 25.8871 40.1224C26.1443 42.1793 28.0675 43.1924 30.0576 42.9455C31.5901 42.7501 32.9219 42.0868 33.5699 40.5749C33.9299 40.6315 34.3515 40.6366 34.7578 40.5852C37.0667 40.2972 38.6866 38.4202 39.098 36.2758C39.134 36.0547 39.1442 35.8593 39.1237 35.6793C39.0311 34.9542 38.45 34.6097 37.8792 34.6817C37.3547 34.7485 36.8456 35.1239 36.7222 35.8799C36.4393 37.1449 35.6474 38.1014 34.4904 38.2454C34.4132 38.2557 34.295 38.2711 34.2075 38.2608ZM32.0117 35.4736C31.9757 35.6639 31.9346 35.8182 31.9346 35.9827C30.8444 35.9981 29.9908 37.0009 30.1399 38.1734C30.2428 38.8419 30.6233 39.1556 31.0295 39.4178C30.865 40.1378 30.3405 40.544 29.7337 40.6212C28.9674 40.7137 28.7155 40.2663 28.6537 39.7984C28.6075 39.4281 28.664 39.063 28.7155 38.8522L29.6102 34.7023C29.7594 34.0235 30.397 33.5658 31.0038 33.4938C31.6106 33.4167 32.058 33.7766 32.1146 34.2292C32.1609 34.5788 32.0992 35.0417 32.0117 35.4736Z" fill="#FDF9F7"/>
                <path d="M53.1055 33.3938C52.5758 33.4606 52.041 33.8258 51.9279 34.4737C51.3622 36.9369 50.4006 38.0322 49.4801 38.1454C49.0841 38.1968 48.863 37.986 48.827 37.6877C48.8167 37.5951 48.8064 37.4974 48.8373 37.4152L49.9223 32.6379C49.9943 32.247 50.0252 31.8459 49.984 31.5117C49.7732 29.8455 48.1739 28.997 46.3946 29.2182C45.6901 29.3107 44.6874 29.609 43.88 30.4523C43.4069 30.0255 42.7075 29.681 41.5711 29.825C40.7688 29.9227 40.3266 30.2158 40.0078 30.4781C39.7506 30.2106 39.3033 30.1078 38.8661 30.1644C38.2593 30.2415 37.6731 30.6118 37.5086 31.2083L35.503 40.6292C35.467 40.8143 35.467 40.9737 35.4824 41.1125C35.575 41.8376 36.2538 42.1719 36.9377 42.0845C37.6063 42.0022 38.2182 41.5239 38.3982 40.7114L39.8895 33.7126C40.198 32.8178 40.7637 32.2727 41.3551 32.1956C41.7408 32.1493 42.0442 32.3293 42.0904 32.679C42.1007 32.7818 42.1007 32.9207 42.0596 33.0647L40.5631 39.719C40.4963 39.9812 40.4757 40.2486 40.5014 40.4646C40.594 41.2102 41.2317 41.5445 41.895 41.4622C42.543 41.3799 43.1961 40.9017 43.3863 40.0224L44.8468 33.3732C45.073 32.3499 45.7415 31.6454 46.3843 31.5682C46.7443 31.522 47.0426 31.7225 47.0889 32.0928C47.1043 32.211 47.0991 32.355 47.0631 32.535L46.0861 36.7775C45.9832 37.2506 45.9627 37.7083 46.0141 38.1197C46.2404 39.9041 47.8345 40.7166 49.5572 40.5006C51.4959 40.2589 53.4911 38.7368 54.3551 34.6485C54.3808 34.5046 54.4013 34.3606 54.3859 34.2269C54.3088 33.5995 53.6917 33.3218 53.1055 33.3938Z" fill="#FDF9F7"/>
                <path d="M61.0942 33.4392C60.5183 35.8253 58.5744 37.008 56.9083 37.2137C55.4787 37.3937 54.4965 36.8229 54.3834 35.9178C54.3577 35.7379 54.3525 35.5682 54.4091 35.3573L54.5171 34.9665C55.1342 35.2493 55.8644 35.3933 56.6512 35.2956C58.4305 35.0693 59.86 33.758 60.1686 31.9273C60.22 31.5417 60.2354 31.1611 60.1943 30.8269C59.9629 28.9653 58.3122 27.726 56.0958 28.0037C54.3525 28.2248 52.779 29.4538 52.3367 31.5005L51.5962 34.9922C51.4985 35.4807 51.4625 35.9641 51.5191 36.4167C51.8122 38.7462 54.1828 39.9238 57.0472 39.5638C59.7726 39.2244 62.6987 37.5017 63.5214 33.5986C63.5626 33.4341 63.5626 33.2952 63.5472 33.1769C63.4752 32.5701 62.8838 32.3027 62.2924 32.3747C61.7473 32.4467 61.2022 32.8118 61.0942 33.4392ZM56.3221 30.3178C56.8775 30.2509 57.2837 30.652 57.3557 31.2228C57.3763 31.3771 57.3763 31.5417 57.3351 31.7062C57.222 32.3799 56.6615 32.6833 56.0752 32.7604C55.705 32.8067 55.3193 32.7758 55.0262 32.6576L55.2885 31.4285C55.4324 30.7857 55.8747 30.3743 56.3221 30.3178Z" fill="#FDF9F7"/>
                <path d="M71.2814 32.0603C70.7209 34.5184 69.7593 35.6138 68.8388 35.7269C68.484 35.7732 68.2731 35.6189 68.232 35.2846C68.2114 35.1509 68.2269 34.9915 68.2629 34.7807L69.2451 30.2451C69.3325 29.8337 69.3736 29.4737 69.3325 29.1395C69.1319 27.571 67.6509 26.5631 66.0825 26.7585C65.3163 26.8562 64.73 27.1031 64.2724 27.5402C64.1078 27.2008 63.5987 27.0722 63.069 27.1391C62.5188 27.2059 62.02 27.5247 61.8914 28.0956L59.7676 37.6604C59.7316 37.8404 59.7316 38.005 59.7522 38.1644C59.8447 38.8895 60.4567 39.1877 61.0841 39.1106C61.768 39.0232 62.4982 38.4935 62.6782 37.573C63.1307 35.588 63.7324 32.7854 64.1644 30.821C64.5706 29.772 65.198 29.2166 65.7431 29.1497C66.0979 29.1035 66.3807 29.3092 66.427 29.6794C66.4424 29.8183 66.4322 30.0034 66.391 30.1782L65.4705 34.395C65.3677 34.863 65.3265 35.3103 65.378 35.7217C65.6042 37.5216 67.2138 38.2981 68.8748 38.0924C70.8752 37.8404 72.8396 36.2206 73.7138 32.23C73.7549 32.0655 73.7755 31.9009 73.7601 31.7672C73.683 31.1399 73.0659 30.8776 72.4796 30.9547C71.95 31.0216 71.3997 31.3867 71.2814 32.0603Z" fill="#FDF9F7"/>
                <path d="M36.0023 43.247L27.358 44.332C26.2369 44.4709 25.8512 45.1959 25.9335 45.8233C26.0055 46.4095 26.5095 46.9289 27.214 46.8415L28.3916 46.6924L27.5894 49.9938L26.6895 50.1069C25.6301 50.2406 25.1982 50.9503 25.2804 51.5777C25.3576 52.1845 25.8975 52.7141 26.8437 52.5959L27.0391 52.5702L26.1855 56.3755C25.7484 58.3091 25.0079 58.7565 23.9845 58.8799C23.2852 58.9724 22.7349 58.5662 22.4984 58.1188C22.519 57.9748 22.5241 57.8308 22.5035 57.692C22.3904 56.7921 21.5213 56.3447 20.7551 56.4424C19.9735 56.5401 19.2535 57.188 19.413 58.4428C19.6444 60.3043 21.7373 61.9088 24.3034 61.5899C26.3243 61.3379 28.1859 60.1706 28.911 56.8898C29.2144 55.4602 29.636 53.6192 29.9497 52.1845L31.1273 52.0353C32.3255 51.8862 32.7112 51.1457 32.6289 50.4978C32.5569 49.927 32.1198 49.4281 31.5285 49.5001L30.5103 49.6287L31.2096 46.3376L35.8172 45.7616C36.9125 45.5816 37.3034 44.8977 37.2211 44.2703C37.1491 43.6789 36.6657 43.1647 36.0023 43.247Z" fill="#FDF9F7"/>
                <path d="M36.5937 46.5322C37.4782 46.419 38.1107 45.6014 37.9976 44.7015C37.8896 43.817 37.0771 43.205 36.1926 43.3181C35.3081 43.4261 34.6705 44.2232 34.7784 45.1077C34.8916 46.0076 35.7092 46.6401 36.5937 46.5322ZM35.2001 56.853L36.5834 50.4301C36.6297 50.1678 36.6966 49.8799 36.6708 49.6844C36.5629 48.8205 35.8583 48.4554 35.1898 48.5377C34.583 48.6148 33.9865 49.1239 33.7962 50.0804C33.4003 52.0088 32.8655 54.4412 32.4695 56.3387C32.3975 56.7501 32.3049 57.2952 32.3461 57.6295C32.5775 59.4756 34.2436 60.3344 36.0435 60.1132C37.9616 59.8715 39.9311 58.4317 40.8002 54.2046C40.8259 54.0812 40.8259 53.9578 40.8105 53.8395C40.7333 53.2327 40.1008 52.9396 39.5146 53.0116C38.9849 53.0784 38.4913 53.4178 38.3318 54.0503C37.7302 56.7193 36.7943 57.65 36.0075 57.7477C35.5601 57.8043 35.2258 57.542 35.1795 57.1718C35.1693 57.0741 35.1744 56.9764 35.2001 56.853Z" fill="#FDF9F7"/>
                <path d="M47.5188 52.8991C47.0149 54.9149 46.1972 56.4679 45.3744 56.5707C45.0967 56.6067 44.927 56.3702 44.891 56.0925C44.8756 55.9794 44.8808 55.82 44.9219 55.6554L45.6727 52.2923C45.7395 51.8912 45.7755 51.526 45.7344 51.1969C45.503 49.3302 43.0552 48.8469 41.9136 48.6463C41.9496 48.4817 41.9496 48.3069 41.929 48.1475C41.8159 47.2476 40.9211 46.5791 40.0366 46.6922C38.8796 46.8362 38.3242 47.9469 38.463 49.0577C38.5247 49.5462 38.7613 50.0347 39.1264 50.3896L38.1802 54.4315C38.1596 54.5909 38.1596 54.7503 38.1751 54.8635C38.2522 55.5114 38.8076 55.784 39.3578 55.712C39.908 55.6451 40.4326 55.2594 40.592 54.6012L41.3171 51.5312C41.8879 51.634 42.6335 51.6803 42.7158 52.3488C42.7261 52.4465 42.7209 52.5648 42.6952 52.7088L42.1347 55.2029C42.0421 55.6811 42.0113 56.0976 42.0576 56.4885C42.2736 58.1957 43.7649 59.1419 45.3899 58.9362C47.5291 58.6688 49.2312 56.5296 49.9666 53.0739C49.9923 52.9505 50.0026 52.8425 49.9872 52.7448C49.9152 52.1586 49.2158 51.85 48.5884 51.9272C48.0793 51.994 47.6217 52.2923 47.5188 52.8991Z" fill="#FDF9F7"/>
                <path d="M57.1815 51.8263C56.8576 53.0502 56.2713 53.9347 55.4383 54.5827C55.4434 54.3204 55.4537 54.0787 55.4177 53.8267C55.2788 52.6903 54.5332 51.6875 53.875 50.839C53.4019 50.2168 52.9236 49.6048 52.7693 49.0032C53.2836 48.6998 53.6436 48.021 53.5664 47.4296C53.4636 46.5862 52.7179 45.8869 51.7357 46.0103C50.9901 46.1028 50.2907 46.5708 50.013 47.373C49.4371 48.962 48.8046 50.5767 48.208 52.1452C46.9327 52.6388 46.4802 54.2073 46.6345 55.462C46.8761 57.3801 48.9794 58.6349 52.4454 58.1978C55.8548 57.771 58.7551 56.0945 59.6293 51.9652C59.6499 51.8778 59.6396 51.7801 59.6293 51.7029C59.5573 51.1321 58.858 50.8081 58.2357 50.8853C57.7626 50.947 57.3255 51.235 57.1815 51.8263ZM50.9078 52.0835L51.0312 51.6926C51.71 52.32 52.3014 53.1994 52.4197 54.125C52.5328 55.0455 52.1368 55.8683 51.1032 56.038C50.4398 56.1202 49.8073 55.9043 49.5296 55.4209C49.6942 55.4363 49.8536 55.4157 49.9873 55.4003C51.1238 55.2563 51.674 54.2176 51.5506 53.2559C51.494 52.8034 51.278 52.3766 50.9078 52.0835Z" fill="#FDF9F7"/>
                <path d="M63.448 51.0777C62.9389 53.3352 61.8281 54.5283 60.6968 54.6671C59.9871 54.7597 59.5089 54.3791 59.442 53.8495C59.4215 53.7106 59.4472 53.5461 59.4626 53.4072L60.7019 47.6991L61.9721 47.5397C62.9697 47.4163 63.4171 46.645 63.3348 45.997C63.2731 45.4879 62.8772 45.0817 62.1367 45.1742L61.2573 45.2874L62.0904 41.2969C62.1058 41.158 62.1109 41.0346 62.1007 40.9163C62.0081 40.1912 61.427 39.6719 60.5682 39.7798C59.9203 39.8621 59.4215 40.3764 59.2723 41.0963L58.2541 45.6628L57.4314 45.7656C56.3772 45.8993 56.0069 46.6141 56.084 47.2466C56.156 47.7969 56.5469 48.2237 57.0714 48.1568L57.7193 48.0745L56.6651 53.001V52.9855C56.5674 53.4741 56.5417 53.9112 56.5931 54.3277C56.84 56.3281 58.7787 57.2743 60.7893 57.0223C63.304 56.7086 65.1655 54.5848 65.8803 51.232C65.9009 51.0931 65.9266 50.9491 65.9112 50.8309C65.834 50.2395 65.217 49.9412 64.605 50.0184C64.1165 50.0801 63.6074 50.4195 63.448 51.0777Z" fill="#FDF9F7"/>
                </svg>
               
          </div>
      </div>
  </div>
 
    <!-- Second Section: Driver Details -->
    <div class="container box" style="margin-top: -20px">
        <div class="flex">
            <!-- Profile -->
            <div style="flex: 2; gap: 16p;background: #F6F8FC;padding: 15px;border-radius: 15px;" >
              <p style="color: #19213D;font-size: 12px;font-weight: 600;margin-bottom: 10px;">Driver Details</p>
               <div style="display: flex;align-items: center;">
                 <div class="" style="width: 35px; height: 35px; overflow: hidden;border-radius:10px;display: inline-block;">
                     <img src=  ${driver.profile_picture} alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
                 </div>
                 <p style="color: #19213D;font-size: 18px;font-weight: 600;margin-left: 10px;">
                  ${driver.full_name}
                </p>
              </div>
              <p style="color: #868DA6;font-size: 11px;font-weight: 400;margin-top: 8px;">Phone Number:   ${driver.phone_number}</p>
              <p style="color: #868DA6;font-size: 11px;font-weight: 400;">Email:   ${driver.email}</p>
            </div>
 
            <!-- Driver Info -->
            <div style="flex: 1;">
                <div style="background: #F6F8FC; border-radius: 8px; padding: 12px; text-align: left; margin-bottom: 12px;">
                    <p class="small">Driver ID</p>
                    <h4 class="bold">  ${driver.short_id}</h4>
                </div>
                <div style="background: #F6F8FC; border-radius: 8px; padding: 12px; text-align: left;">
                    <p class="small">Issued:</p>
                    <h4>  ${date}</h4>
                </div>
            </div>
        </div>
    </div>
 
    <!-- Third Section: Summary Table -->
    <div class="container box" style="margin-top: 15px;">
        <div class="flex" style="padding: 15px 20px">
            <p style="color: #868DA6;font-size: 11px;font-weight: 400;">CATEGORY</p>
            <p style="color: #868DA6;font-size: 11px;font-weight: 400;">AMOUNT (CAD)</p>
        </div>
        <div class="flex" style="padding: 15px 20px; border: 1px solid #E5E7EB;border-radius: 50px;margin-bottom: 10px;">
            <p class="bold">Total Distance Driven on the App</p>
            <p class="bold">  ${statistics.totalDistance} km</p>
        </div>
        <div class="flex" style="padding: 15px 20px; border: 1px solid #E5E7EB;border-radius: 50px;margin-bottom: 10px;">
          <p class="bold">Total Number of Rides Completed</p>
            <p class="bold">${statistics.completedRides} Rides</p>
        </div>
        <div class="flex" style="padding: 15px 20px; border: 1px solid #E5E7EB;border-radius: 50px;margin-bottom: 10px;">
          <p class="bold">Total Gross Earnings (before commissions)</p>
            <p class="bold">$${statistics.grossEarnings} </p>
        </div>
        <div class="flex" style="padding: 15px 20px; border: 1px solid #E5E7EB;border-radius: 50px;margin-bottom: 10px;">
          <p class="bold">Total Commissions Deducted</p>
            <p class="bold">$${statistics.totalCommissions} </p>
        </div>
    </div>
 
    <!-- Fourth Section: Important Notes -->
    <div class="container box" style="margin-top: 20px;margin-bottom: 20px;">
        <p style="color: #5D6481;font-weight: 600;font-size: 12px;">Important Notes:</p>
        <ul style="margin: 0 0 20px; padding: 0 0 0 20px;">
            <li style="color: #5D6481;font-weight: 500;font-size: 12px;" >Gross Earnings: Total income earned from Rides, including fares and tips, before any deductions.</li>
            <li style="color: #5D6481;font-weight: 500;font-size: 12px;" >Commissions Deducted: Represents the total fees deducted by the platform.</li>
            <li style="color: #5D6481;font-weight: 500;font-size: 12px;" >Distance Driven: Used for calculating vehicle-related expenses when filing taxes.</li>
        </ul>
        <p style="color: #5D6481;font-weight: 600;font-size: 12px;">Prepared By:</p>
        <p style="color: #5D6481;font-weight: 500;font-size: 12px;">
            Women First LLC.<br>
            8801 Resources Rd, Grande Prairie, AB T8V 3A6, Canada<br>
            +1 (587) 818-5330<br>
            <a href="mailto:info@womenfirst.ca" style="color: #5E17EB; text-decoration: none;">info@womenfirst.ca</a>
        </p>
    </div>
 
</body>
</html>`;

  try {
    // Generate PDF as a buffer
    const pdfBuffer = await generatePdfBuffer(html);

    // Upload the PDF to Firebase Storage and get the public URL
    const publicUrl = await uploadPdfToFirebase(
      fbConnection,
      pdfBuffer,
      `tax-${Date.now()}.pdf`,
      driver.short_id
    );

    console.log("url", publicUrl);
    // Send email with the PDF link
    await sendDriverEarningsEmail(publicUrl, req);

    // Respond to the client
    res.status(200).json({
      message: "PDF generated, uploaded, and email sent successfully",
      pdfUrl: publicUrl,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }

  // Generate the PDF
  // pdf.create(html).toFile(localFilePath, async (err) => {
  //   if (err) {
  //     console.error("Error generating PDF:", err);
  //     return res.status(500).json({ message: "Failed to generate PDF" });
  //   }

  //   console.log("PDF generated successfully.");

  //   try {
  //     // Define the destination path in Firebase Storage
  //     const destination = `driverAnalysis/output-${Date.now()}.pdf`;

  //     // Upload the file to Firebase Storage
  //     const [file] = await bucket.upload(localFilePath, {
  //       destination,
  //       public: true, // Make the file publicly accessible
  //       metadata: {
  //         contentType: "application/pdf",
  //       },
  //     });

  //     // Get the public URL for the uploaded file
  //     const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  //     console.log("PDF uploaded to Firebase Storage:", publicUrl);

  //     // send driver Earnings email
  //     sendDriverEarningsEmail(publicUrl, req);

  //     res.status(200).json({
  //       message: "PDF generated and uploaded successfully",
  //       pdfUrl: publicUrl,
  //     });
  //   } catch (error) {
  //     console.error("Error uploading PDF to Firebase Storage:", error);
  //     res
  //       .status(400)
  //       .json({ message: "Failed to upload PDF to Firebase Storage" });
  //   } finally {
  //     // Clean up the local file
  //     if (fs.existsSync(localFilePath)) {
  //       fs.unlinkSync(localFilePath);
  //       console.log("Temporary PDF file removed.");
  //     }
  //   }
  // });
});
const genralAnalysis = asyncHandler(async (req, res, next) => {
  customLog({
    data: `Start !!!`,
    req,
    onlyMsg: false,
  });
  try {
    // const now = new Date();
    // const startOfToday = new Date(
    //   now.getFullYear(),
    //   now.getMonth(),
    //   now.getDate() - 1,
    //   0,
    //   0,
    //   0
    // );
    // const endOfToday = new Date(
    //   now.getFullYear(),
    //   now.getMonth(),
    //   now.getDate(),
    //   0,
    //   0,
    //   0
    // );
    // const now = new Date();
    for (let day = 1; day <= 28; day++) {
      // Set start and end of the current day
      const startOfToday = new Date(Date.UTC(2025, 0, day, 0, 0, 0)); // ✅ Wrap in new Date()
      const endOfToday = new Date(Date.UTC(2025, 0, day, 23, 59, 59, 999)); // ✅ Wrap in new Date()

      // Extract day, month, and year correctly
      const year = startOfToday.getUTCFullYear(); // ✅ Use getUTCFullYear()
      const month = (startOfToday.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0"); // ✅ Corrected
      const currentDay = startOfToday.getUTCDate().toString().padStart(2, "0"); // ✅ Corrected

      console.log(
        `Fetching data rides between ${startOfToday} and ${endOfToday}`
      );
      let mongooseConnection = req.app.locals.mongooseConnection;
      // Fetch drivers created today
      const driversCreatedToday = await driverModel(mongooseConnection).find({
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      const totalDriversCreatedToday = driversCreatedToday.length;

      console.log(`Total Drivers Created Today: ${totalDriversCreatedToday}`);

      // Update Firebase with total driver count
      const fbConnection = req.app.locals.fbConnection;

      // ********************************** customers *****************************
      // Fetch customers created yesterday
      const customersCreatedYesterday = await customerModel(
        mongooseConnection
      ).find({
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      const totalCustomersCreatedYesterday = customersCreatedYesterday.length;

      console.log(
        `Total Customers Created Yesterday: ${totalCustomersCreatedYesterday}`
      );

      //************************************************admins  */
      // Fetch admins created yesterday
      const adminsCreatedYesterday = await adminModel(mongooseConnection).find({
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      const totalAdminsCreatedYesterday = adminsCreatedYesterday.length;

      console.log(
        `Total Admins Created Yesterday: ${totalAdminsCreatedYesterday}`
      );

      // ************************rides ***********************************
      // Fetch all rides created yesterday
      const ridesCreatedYesterday = await rideModel(mongooseConnection).find({
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      const totalRidesCreatedYesterday = ridesCreatedYesterday.length;

      // Separate rides by type
      const ridesByDispatcher = ridesCreatedYesterday.filter(
        (ride) => ride.created_by === "dispatch"
      ).length;
      const ridesByCustomer = ridesCreatedYesterday.filter(
        (ride) => ride.created_by === "customer"
      ).length;
      const scheduledRides = ridesCreatedYesterday.filter(
        (ride) => ride.schedule === true
      ).length;
      // const deliveredRides = ridesCreatedYesterday.filter(
      //   (ride) => ride.status === "delivered"
      // ).length;
      // const canceledRides = ridesCreatedYesterday.filter(
      //   (ride) => ride.status === "canceled"
      // ).length;

      console.log(
        `Total Rides Created Yesterday: ${totalRidesCreatedYesterday}`
      );
      console.log(`Rides Created by Dispatcher: ${ridesByDispatcher}`);
      console.log(`Rides Created by Customer: ${ridesByCustomer}`);
      // console.log(`Rides delivered: ${deliveredRides}`);
      // console.log(`Rides canceled: ${canceledRides}`);
      console.log(`Scheduled Rides: ${scheduledRides}`);

      // Aggregation pipeline for delivered rides
      const deliveredRidesMetrics = await rideModel(
        mongooseConnection
      ).aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: {
              $gte: startOfToday,
              $lt: endOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDuration: {
              $sum: { $subtract: ["$completed_at", "$assigned_at"] },
            },
            deliveredRides: { $sum: 1 }, // Count of rides
            totalDistance: { $sum: "$estimation_distance" },
            totalPrice: { $sum: "$pay_info.total_ride" },
            totalCompanyPercentage: { $sum: "$pay_info.company" },
            totalDriversEarning: { $sum: "$pay_info.driver" },
          },
        },
      ]);
      const deliveredRidesMetricscanceled = await rideModel(
        mongooseConnection
      ).aggregate([
        {
          $match: {
            status: "canceled",
            createdAt: {
              $gte: startOfToday,
              $lt: endOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,

            canceledRides: { $sum: 1 }, // Count of rides
          },
        },
      ]);

      const metrics = deliveredRidesMetrics[0] || {
        totalDuration: 0,
        deliveredRides: 0,
        totalDistance: 0,
        totalPrice: 0,
        totalCompanyPercentage: 0,
        totalDriversEarning: 0,
      };
      const metricscanceled = deliveredRidesMetricscanceled[0] || {
        canceledRides: 0,
      };

      console.log("Delivered Rides Metrics:", metrics);

      // Example Firebase update
      // const fbConnection = {}; // Replace with actual Firebase connection
      await projectAnalysis({
        fbConnection,
        data: {
          totalDriver: totalDriversCreatedToday,
          totalCustomer: totalCustomersCreatedYesterday,
          totalDispatch: totalAdminsCreatedYesterday,
          totalRide: totalRidesCreatedYesterday,
          cancelRides: metricscanceled.canceledRides,
          completeRides: metrics.deliveredRides,
          scheduledRides: scheduledRides,
          dispatchRides: ridesByDispatcher,
          totalDuration: metrics.totalDuration,
          totalDistance: metrics.totalDistance,
          priceRides: metrics.totalPrice,
          companyPercentage: metrics.totalCompanyPercentage,
          driverEarning: metrics.totalDriversEarning,
        },
        year,
        month,
        currentDay,
      });

      // ***********************drivers    *******************************
      const driverMetrics = await rideModel(mongooseConnection).aggregate([
        {
          $match: {
            status: "delivered",
            "driver_info.uid": { $exists: true, $ne: "" }, //
            createdAt: {
              $gte: startOfToday,
              $lt: endOfToday,
            },
          },
        },
        {
          $group: {
            _id: "$driver_info.uid", // Group by driver UID
            deliveredRides: { $sum: 1 }, // Count of rides
            totalDuration: {
              $sum: { $subtract: ["$completed_at", "$assigned_at"] },
            }, // Total duration
            totalDistance: { $sum: "$estimation_distance" }, // Total distance
            priceRides: { $sum: "$pay_info.total_ride" }, // Total distance
            totalEarnings: { $sum: "$pay_info.driver" }, // Total driver earnings
            companyPercentage: { $sum: "$pay_info.company" }, // Total driver earnings
          },
        },
      ]);

      console.log("Driver Metrics:", driverMetrics);

      // Update Firebase for each driver
      for (const driverMetric of driverMetrics) {
        const {
          _id: driverId,
          deliveredRides,
          totalDuration,
          totalDistance,
          priceRides,
          totalEarnings,
          companyPercentage,
        } = driverMetric;

        console.log(`Updating analysis for Driver ID: ${driverId}`);

        await driverAnalysis({
          fbConnection,
          data: {
            completeRides: deliveredRides,
            totalDuration: totalDuration,
            totalDistance: totalDistance,
            priceRides: priceRides,
            driverEarning: totalEarnings,
            companyPercentage,
          },
          id: driverId,
          year,
          month,
          currentDay,
        });
      }

      // Aggregation pipeline to calculate metrics for each driver
      const driverAnalysisMetrics = await rideModel(
        mongooseConnection
      ).aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday, $lt: endOfToday }, // Filter rides by date range
            "driver_info.uid": { $exists: true, $ne: "" }, //
          },
        },
        {
          $group: {
            _id: "$driver_info.uid", // Group by driver UID
            totalRides: { $sum: 1 }, // Count total rides
            dispatchRides: {
              $sum: { $cond: [{ $eq: ["$created_by", "dispatch"] }, 1, 0] },
            }, // Count dispatched rides
            scheduledRides: { $sum: { $cond: ["$schedule", 1, 0] } }, // Count scheduled rides
          },
        },
      ]);

      console.log("Driver Metrics:", driverAnalysisMetrics);

      // Update Firebase for each driver
      for (const driverMetric of driverAnalysisMetrics) {
        const {
          _id: driverId,
          totalRides,
          dispatchRides,
          scheduledRides,
        } = driverMetric;

        console.log(`Updating analysis for Driver ID: ${driverId}`);

        await driverAnalysis({
          fbConnection,
          data: {
            totalRide: totalRides,
            dispatchRides,
            scheduledRides,
          },
          id: driverId,
          year,
          month,
          currentDay,
        });
      }

      const driverAnalysisMetrics2 = await rideModel(
        mongooseConnection
      ).aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfToday,
              $lt: endOfToday,
            }, // Filter rides by date range
            status: "canceled",
            "driver_info.uid": { $exists: true, $ne: "" }, //
          },
        },
        {
          $group: {
            _id: "$driver_info.uid", // Group by driver UID
            canceledRides: {
              $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
            }, // Count canceled rides
          },
        },
      ]);

      // Update Firebase for each driver
      for (const driverMetric of driverAnalysisMetrics2) {
        const { _id: driverId, canceledRides } = driverMetric;

        console.log(`Updating analysis for Driver ID: ${driverId}`);

        await driverAnalysis({
          fbConnection,
          data: {
            cancelRides: canceledRides,
          },
          id: driverId,
          year,
          month,
          currentDay,
        });
      }
    }
    res.json({ message: "success" });
  } catch (error) {
    console.error("Error aggregating delivered rides per driver:", error);
  }
});
module.exports = {
  getDashboardAnalysis,
  getDashboardRides,
  getDashboardDriverEarnings,
  getDashboardRevenue,
  getDashboardYearlyData,
  getDriverAnalysis,
  sendEarningsEmail,
  genralAnalysis,
};
