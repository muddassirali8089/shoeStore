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
  return createTransport().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
    html: `<p>${message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`,
  });
}