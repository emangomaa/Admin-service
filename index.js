const express = require("express");
const {
  ApiError,
  connectFirebase,
  setup,
  ERROR_TYPES,
  globalError,
  checkProject,
  customLog,
} = require("./main/index");
const adminApiRouter = require("./src/routes/index.routes");
const cors = require("cors");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const { connect } = require("mongoose");
const keyMiddleware = require("./src/key.middleware/key.middlewares");
const setMyCacheMiddleware = require("./src/key.middleware/cache.data");

// const dbConnection = () => {
//   console.log(process.env.APP_ENV);
//   connect(
//     process.env.APP_ENV == "ridewyze"
//       ? process.env.DB_URL_ridewyze
//       : process.env.DB_URL
//   )
//     // connect("mongodb://127.0.0.1:27017/RR")
//     .then((conn) => console.log("Database conected", conn.connection.host))
//     .catch((err) => console.log("Database Connection Error", err));
// };
// /// dbConnection
// dbConnection();

const app = express();
app.use(express.json());

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
if (process.env.NODE_ENV == "dev") {
  app.use(morgan("dev"));
}

// firebase linking
// connectFirebase(app, process.env.APP_ENV);

app.use(
  "/api/v1/admin",
  setup,
  setMyCacheMiddleware,
  keyMiddleware,
  checkProject,
  adminApiRouter
);

///  Error Handling
app.all("*", (req, res, next) => {
  next(
    new ApiError(
      `Can't find this route : ${req.originalUrl}`,
      404,
      ERROR_TYPES.route_not_found
    )
  );
});

/// Global Error Handling Middleware
app.use(globalError);

//// localhost app
app.listen(process.env.PORT, () => {
  customLog({
    data: `server Admin App is running on port ${process.env.PORT}`,
  });
});
