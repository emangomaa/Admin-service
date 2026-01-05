const { sendSendgridEmail } = require("../../../main/index.js");

const sendForgetPasswordEmail = async (email, req, admin) => {
  const fb = req.app.locals.fbConnection;
  const auth = fb.auth();
  const name = admin.name;

  const actionCodeSettings = {
    url: req.app.locals.keys.firebaseProjectUrl,
  };
  const template_id = req.app.locals.keys.sendForgetPasswordEmail_template_id;
  auth
    .generatePasswordResetLink(email, actionCodeSettings)
    .catch((err) => {
      console.error(err);
    })
    .then((link) => {
      console.log("link created", link);
      const dynamic_template_data = {
        Logo: req.app.locals.keys.logoForEmail,
        Color: req.app.locals.keys.colorForEmail,
        UserName: name,
        CompanyName: req.app.locals.keys.CompanyNameForEmail,
        ResetLink: link,
        GooglePlayLink: req.app.locals.keys.GooglePlayLink,
        AppStoreLink: req.app.locals.keys.AppStoreLink,
        InstagramLink: "", //req.app.locals.keys.InstagramLinkForEmail,
        FacebookLink:
          "https://web.facebook.com/p/Women-First-Cabs-100095061590513/?paipv=0&eav=AfYeoLe34HfJqCdcf72qaI4dNMgcFzmenDydREuUa2wWIl5WRUZHiEyFnL634Se1Sv4&_rdc=1&_rdr", // req.app.locals.keys.FacebookLinkForEmail,
        WebsiteLink: req.app.locals.keys.WebsiteLinkForEmail,
        LinkedinLink:
          "https://www.linkedin.com/company/women-first-inc/?originalSubdomain=ca", //req.app.locals.keys.LinkedinLinkForEmail,
      };
      sendSendgridEmail({
        to: email,
        from: req.app.locals.keys.fromEmail,
        template_id,
        dynamic_template_data,
        subject: `${req.app.locals.keys.CompanyNameForEmail} Reset Password`,
      });
    });
};

module.exports = sendForgetPasswordEmail;
