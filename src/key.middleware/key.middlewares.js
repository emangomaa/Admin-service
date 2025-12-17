const { SecretManagerServiceClient } =
  require("@google-cloud/secret-manager").v1;
const asyncHandler = require("express-async-handler");
const { getKeys, getEnv, customLog } = require("../../main");

const dotenv = require("dotenv").config();
const morgan = require("morgan");

const keyMiddleware = asyncHandler(async (req, res, next) => {
  if (req.query.projectId == "roadrunner") {
    req.query.env = "dev";
  } else {
    req.query.env = "prod";
  }
  let myCache = req.app.locals.myCache;
  let value = myCache.get(`key_${req.query.projectId}`);
  if (value == undefined) {
    const env = req.query.env;
    customLog({ data: { env } });
    await getKeys(
      {
        client_email:
          env == "dev"
            ? process.env.client_email_dev
            : process.env.client_email_prod,
        private_key:
          env == "dev"
            ? process.env.private_key_dev.toString()
            : process.env.private_key_prod.toString(),
        projectId:
          env == "dev" ? process.env.projectId_dev : process.env.projectId_prod,
        name: `projects/${
          env == "dev" ? process.env.name_dev : process.env.name_prod
        }/secrets/${req.query.projectId}/versions/latest`,
      },
      req,
      myCache,
      `key_${req.query.projectId}`
    );
    next();
  } else {
    customLog({ data: "have key value !!!" });

    req.app.locals.keys = value;

    next();
  }
});
module.exports = keyMiddleware;
