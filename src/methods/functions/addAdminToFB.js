const { customLog } = require("../../../main");
const sendWelcomeEmail = require("./sendWelcomeEmail");

const addAdminToFB = async (req, email, password, type) => {
  const fb = req.app.locals.fbConnection;

  let fUid = "error";
  const userRecord = await fb
    .auth()
    .createUser({
      email: email,
      password: password,
    })
    .then(async (user) => {
      const updatedClaims = {
        dispatch: type == "dispatch" || type == "manager" || type == "admin",
        manager: type == "admin" || type == "manager",
        admin: type == "admin",
      };
      customLog({
        data: { updatedClaims, uid: user.uid },
      });
      await fb.auth().setCustomUserClaims(user.uid, updatedClaims);
      await sendWelcomeEmail(email, req);
      fUid = user.uid;
    })
    .catch((e) => {
      fUid = "error";
    });
  return fUid;
};

module.exports = addAdminToFB;
