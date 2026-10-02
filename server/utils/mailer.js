import nodemailer from "nodemailer";

function createTransport() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error("Email delivery is not configured.");
  }
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });
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