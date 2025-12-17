const deleteAdminFromFB = async (req, uid) => {
  const fb = req.app.locals.fbConnection;

  const userRecord = await fb.auth().deleteUser(uid);
};

module.exports = deleteAdminFromFB;
