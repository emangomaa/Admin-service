const NodeCache = require("node-cache");
const asyncHandler = require("express-async-handler");

let myCache;
const createMyCache = () => {
  myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  return myCache;
};

const getMyCache = () => {
  if (myCache) {
    return myCache;
  } else {
    return createMyCache();
  }
};

const setMyCacheMiddleware = asyncHandler(async (req, res, next) => {
  req.app.locals.myCache = getMyCache();
  return next();
});

module.exports = setMyCacheMiddleware;
