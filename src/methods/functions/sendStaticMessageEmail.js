const { sendSendgridEmail } = require("../../../main/index.js");

const sendStaticMessageEmail = async (email, req) => {
  const fb = req.app.locals.fbConnection;
  let projectId = req.query.projectId;
  const auth = fb.auth();
  let { subject, body, img } = req.body;

  const template_id = req.app.locals.keys.sendStaticMessageEmail_template_id;

  const dynamic_template_data = {
    Logo: req.app.locals.keys.logoForEmail,
    Color: req.app.locals.keys.colorForEmail,
    Image: img,
    Subject: subject,
    Body: body,
    CompanyName: req.app.locals.keys.CompanyNameForEmail,
    InstagramLink: "", // req.app.locals.keys.InstagramLinkForEmail,
    FacebookLink:
      "https://web.facebook.com/p/Women-First-Cabs-100095061590513/?paipv=0&eav=AfYeoLe34HfJqCdcf72qaI4dNMgcFzmenDydREuUa2wWIl5WRUZHiEyFnL634Se1Sv4&_rdc=1&_rdr", // req.app.locals.keys.FacebookLinkForEmail,
    WebsiteLink: req.app.locals.keys.WebsiteLinkForEmail,
    LinkedinLink:
      "https://www.linkedin.com/company/women-first-inc/?originalSubdomain=ca", // req.app.locals.keys.LinkedinLinkForEmail,
  };
  sendSendgridEmail({
    to: email,
    from: req.app.locals.keys.fromEmail,
    template_id,
    dynamic_template_data,
    subject: `${req.app.locals.keys.CompanyNameForEmail} static Email`,
  });
};

module.exports = sendStaticMessageEmail;
