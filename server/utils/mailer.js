import nodemailer from "nodemailer";

export function getEmailTransportOptions(env = process.env) {
  const emailUser = env.EMAIL_USER?.trim();
  const emailPassword = env.EMAIL_PASSWORD;
  const emailDomain = emailUser?.toLowerCase().split("@").pop();
  const isGmail = emailDomain === "gmail.com" || emailDomain === "googlemail.com";
  const host = env.EMAIL_HOST?.trim() || (isGmail ? "smtp.gmail.com" : "");
  const configuredPort = env.EMAIL_PORT?.trim();
  const port = Number(configuredPort || (isGmail ? 465 : ""));

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !emailUser || !emailPassword) {
    throw new Error(
      isGmail
        ? "Email delivery requires EMAIL_USER and EMAIL_PASSWORD."
        : "Email delivery requires EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.",
    );
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user: emailUser, pass: emailPassword },
  };
}

function createTransport() {
  return nodemailer.createTransport(getEmailTransportOptions());
}

export async function sendPasswordResetCode(email, code, expiryMinutes) {
  return createTransport().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "ShoeStore admin password reset code",
    text: `Your verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Your ShoeStore admin verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in ${expiryMinutes} minutes.</p>`,
  });
}

export async function sendPasswordResetConfirmation(email) {
  return createTransport().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "ShoeStore admin password changed",
    text: "Your admin password was successfully changed.",
    html: "<p>Your ShoeStore admin password was successfully changed.</p>",
  });
}

export async function sendOrderEmail(email, subject, message) {
  if (!email) return;
  const escapedMessage = message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return createTransport().sendMail({
    from: process.env.EMAIL_FROM || `"ShoeStore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: `${message}\n\nThank you for shopping with ShoeStore. If you have any questions, reply to this email and our team will be happy to help.`,
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f4f5f2;color:#202820;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f2;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e8e2;border-radius:8px">
          <tr><td style="padding:24px 30px;border-bottom:1px solid #edf0eb;color:#326b4f;font-size:20px;font-weight:bold">ShoeStore</td></tr>
          <tr><td style="padding:30px">
            <p style="margin:0 0 12px;color:#687268;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Order update</p>
            <p style="margin:0;font-size:17px;line-height:1.7">${escapedMessage}</p>
            <p style="margin:24px 0 0;color:#687268;font-size:14px;line-height:1.6">Thank you for shopping with ShoeStore. If you have any questions, reply to this email and our team will be happy to help.</p>
          </td></tr>
          <tr><td style="padding:17px 30px;background:#fafbf9;border-top:1px solid #edf0eb;color:#7b847b;font-size:11px;line-height:1.6">This is a transactional message about your ShoeStore order.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  });
}