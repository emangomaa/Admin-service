const nodemailer = require("nodemailer");
const { emailTemplete } = require("./emailTemplete.js");
const sendEmail = (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper
  async function main() {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: "<process.env.EMAIL_SENDER>",
      to: options.email, // list of receivers
      subject: "Verify Mail ✔", // Subject line
      text: "Hello", // plain text body
      html: emailTemplete(options), // html body
    });
  }
  main().catch(console.error);
};

module.exports = sendEmail;
