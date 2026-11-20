import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "./context/AdminAuthContext";
import InlineSpinner from "../components/common/InlineSpinner";

const styles = `
.admin-recovery { align-items: center; background: #f5f7f4; color: #18221e; display: flex; font-family: "DM Sans", "Segoe UI", sans-serif; justify-content: center; min-height: 100vh; padding: 28px 18px; }
.admin-recovery * { box-sizing: border-box; }
.admin-recovery-card { background: #fff; border: 1px solid #e6ebe7; border-radius: 13px; box-shadow: 0 18px 55px #19271e0d; max-width: 440px; padding: 35px 38px 30px; width: 100%; }
.admin-recovery-brand { align-items: center; color: #18221e; display: flex; font: 800 15px/1 "Manrope", "Segoe UI", sans-serif; gap: 9px; letter-spacing: -.055em; margin-bottom: 38px; text-decoration: none; }
.admin-recovery-mark { align-items: center; background: #326b4f; border-radius: 9px; color: white; display: flex; height: 32px; justify-content: center; width: 32px; }
.admin-recovery-brand span:last-child { font-weight: 500; }
.admin-recovery-icon { align-items: center; background: #eaf3ed; border-radius: 10px; color: #326b4f; display: flex; height: 42px; justify-content: center; margin-bottom: 19px; width: 42px; }
.admin-recovery h1 { font: 700 25px/1.25 "Manrope", "Segoe UI", sans-serif; letter-spacing: -.045em; margin: 0 0 9px; }
.admin-recovery-description { color: #77817a; font-size: 13px; line-height: 1.65; margin: 0 0 24px; }
.admin-recovery-form { display: grid; gap: 16px; }
.admin-recovery-field { color: #47534b; display: grid; font-size: 11px; font-weight: 650; gap: 7px; }
.admin-recovery-field input { background: #fff; border: 1px solid #dce3dd; border-radius: 6px; color: #1c2921; font: 13px "DM Sans", "Segoe UI", sans-serif; min-height: 41px; outline: none; padding: 0 11px; width: 100%; }
.admin-recovery-field input:focus, .admin-recovery-code-input:focus { border-color: #659275; box-shadow: 0 0 0 3px #326b4f16; }
.admin-recovery-password { position: relative; }
.admin-recovery-password input { padding-right: 43px; }
.admin-recovery-eye { align-items: center; background: transparent; border: 0; color: #77817a; cursor: pointer; display: flex; height: 38px; justify-content: center; position: absolute; right: 3px; top: 1px; width: 38px; }
.admin-recovery-button { align-items: center; background: #326b4f; border: 0; border-radius: 6px; color: white; cursor: pointer; display: flex; font: 650 12px "DM Sans", "Segoe UI", sans-serif; justify-content: center; min-height: 41px; padding: 0 13px; width: 100%; }
.admin-recovery-button:hover { background: #26583e; }
.admin-recovery-button:disabled { cursor: not-allowed; opacity: .55; }
.admin-recovery-message { border: 1px solid #dce9df; border-radius: 6px; color: #315f42; font-size: 12px; line-height: 1.55; margin-bottom: 16px; padding: 10px 12px; }
.admin-recovery-message.error { background: #fff8f7; border-color: #f0d8d4; color: #a13e39; }
.admin-recovery-message.success { background: #f3faf4; }
.admin-recovery-demo { background: #f7f9f7; border: 1px dashed #bdcbbf; border-radius: 7px; color: #647168; font-size: 11px; line-height: 1.6; margin-top: 15px; padding: 10px 12px; }
.admin-recovery-demo strong { color: #26382c; font-size: 15px; letter-spacing: .16em; margin-left: 5px; }
.admin-recovery-code-row { display: grid; gap: 8px; grid-template-columns: repeat(6, minmax(0, 1fr)); margin: 4px 0 2px; }
.admin-recovery-code-input { border: 1px solid #dce3dd; border-radius: 7px; color: #1c2921; font: 700 22px "DM Sans", "Segoe UI", sans-serif; height: 52px; outline: none; text-align: center; width: 100%; }
.admin-recovery-countdown { color: #77817a; font-size: 11px; margin: -7px 0 0; }
.admin-recovery-resend { background: none; border: 0; color: #326b4f; cursor: pointer; font: 650 11px "DM Sans", "Segoe UI", sans-serif; justify-self: center; padding: 3px 8px; }
.admin-recovery-resend:disabled { color: #89938c; cursor: default; }
.admin-recovery-back { align-items: center; color: #67736b; display: inline-flex; font-size: 11px; gap: 6px; margin-top: 22px; text-decoration: none; }
.admin-recovery-back:hover { color: #26583e; }
.admin-recovery-footnote { border-top: 1px solid #edf0ed; color: #8a938c; font-size: 10px; line-height: 1.6; margin-top: 23px; padding-top: 16px; }
@media (max-width: 480px) { .admin-recovery-card { padding: 28px 23px 24px; } .admin-recovery-brand { margin-bottom: 30px; } }
`;

function RecoveryFrame({ children }) {
  return <main className="admin-recovery"><style>{styles}</style><section className="admin-recovery-card"><Link className="admin-recovery-brand" to="/admin/login"><span className="admin-recovery-mark"><ShieldCheck size={18} /></span>morrow<span>goods</span></Link>{children}</section></main>;
}

function Message({ children, type = "error" }) {
  return children ? <div className={`admin-recovery-message ${type}`} role={type === "error" ? "alert" : "status"}>{children}</div> : null;
}

export function ForgotPasswordPage() {
  const { beginRecovery, clearRecovery } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      await beginRecovery(email);
      navigate("/admin/verify-code", { state: { notice: "If an admin account exists for that email, a verification code has been sent." } });
    } catch (recoveryError) {
      clearRecovery();
      setError(recoveryError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return <RecoveryFrame><div className="admin-recovery-icon"><Mail size={20} /></div><h1>Forgot Password?</h1><p className="admin-recovery-description">Enter your admin email address and we’ll send a 6-digit verification code if the account is eligible.</p><Message>{error}</Message><form className="admin-recovery-form" onSubmit={submit}><label className="admin-recovery-field">Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={submitting} /></label><button className="admin-recovery-button" type="submit" disabled={submitting} aria-busy={submitting}>{submitting && <InlineSpinner label="Sending code" />}Send Verification Code</button></form><div className="admin-recovery-footnote">A verified code is required to reset the administrator password.</div><Link className="admin-recovery-back" to="/admin/login"><ArrowLeft size={14} /> Back to sign in</Link></RecoveryFrame>;
}

function useRemainingTime(expiresAt) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const refresh = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(refresh);
      window.clearInterval(timer);
    };
  }, []);
  return now === null ? null : Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function VerifyCodePage() {
  const { challenge, verifyCode, resendCode, isVerificationCodeValid } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(location.state?.notice || "");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);
  const remaining = useRemainingTime(challenge?.expiresAt || 0);
  const code = digits.join("");

  function updateDigits(value, startIndex = 0) {
    const cleanValue = String(value).replace(/\D/g, "");
    if (cleanValue.length >= 6) startIndex = 0;
    const next = startIndex === 0 && cleanValue.length >= 6 ? ["", "", "", "", "", ""] : [...digits];
    const pasted = cleanValue.slice(0, 6 - startIndex);
    [...pasted].forEach((digit, offset) => { next[startIndex + offset] = digit; });
    if (!cleanValue) next[startIndex] = "";
    setDigits(next);
    setError("");
    setStatus("");
    const focusIndex = Math.min(startIndex + pasted.length, 5);
    inputs.current[focusIndex]?.focus();
  }

  function onKeyDown(event, index) {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        inputs.current[index - 1]?.focus();
      }
      setDigits(next);
      setError("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setVerifying(true);
      await verifyCode(code);
      navigate("/admin/reset-password");
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    try {
      setResending(true);
      await resendCode();
      setDigits(["", "", "", "", "", ""]);
      setError("");
      setStatus("If an admin account exists, a new code has been sent.");
      inputs.current[0]?.focus();
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setResending(false);
    }
  }

  if (!challenge) return <RecoveryFrame><div className="admin-recovery-icon"><KeyRound size={20} /></div><h1>No active code</h1><p className="admin-recovery-description">Start a new recovery request to receive a verification code.</p><Link className="admin-recovery-button" to="/admin/forgot-password">Request a code</Link></RecoveryFrame>;

  return (
    <RecoveryFrame>
      <div className="admin-recovery-icon"><KeyRound size={20} /></div>
      <h1>Verify Your Account</h1>
      <p className="admin-recovery-description">Enter the 6-digit verification code for <strong>{challenge.email}</strong>.</p>
      <Message>{error}</Message>
      <Message type="success">{status}</Message>
      <form className="admin-recovery-form" onSubmit={submit}>
        <div className="admin-recovery-code-row" aria-label="Six-digit verification code">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => { inputs.current[index] = node; }}
              className="admin-recovery-code-input"
              aria-label={`Code digit ${index + 1}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={verifying || resending}
              onChange={(event) => updateDigits(event.target.value, index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              onPaste={(event) => {
                event.preventDefault();
                updateDigits(event.clipboardData.getData("text"), index);
              }}
            />
          ))}
        </div>
        <p className="admin-recovery-countdown">
          {remaining === null ? "Checking code expiry…" : remaining ? `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}.` : "This code has expired."}
        </p>
        <button className="admin-recovery-button" type="submit" disabled={verifying || resending || code.length !== 6 || remaining === null || !isVerificationCodeValid()} aria-busy={verifying}>{verifying && <InlineSpinner label="Verifying code" />}Verify Code</button>
      </form>
      <button className="admin-recovery-resend" type="button" onClick={resend} disabled={verifying || resending} aria-busy={resending}>{resending && <InlineSpinner label="Resending code" />} Resend Code</button>
      <Link className="admin-recovery-back" to="/admin/forgot-password"><ArrowLeft size={14} /> Use a different email</Link>
    </RecoveryFrame>
  );
}

function PasswordInput({ label, value, onChange, visible, onToggle, autoComplete }) {
  const Icon = visible ? EyeOff : Eye;
  return <label className="admin-recovery-field">{label}<span className="admin-recovery-password"><input type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={onChange} required /><button className="admin-recovery-eye" type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={onToggle}><Icon size={16} /></button></span></label>;
}

export function ResetPasswordPage() {
  const { challenge, resetPassword, isPasswordResetAllowed } = useAdminAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const remaining = useRemainingTime(challenge?.expiresAt || 0);
  const remainingMinutes = remaining === null ? null : Math.ceil(remaining / 60);
  const verified = isPasswordResetAllowed() && remaining > 0;

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("Your password must be at least 8 characters long."); return; }
    if (!confirmPassword) { setError("Please confirm your new password."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    try {
      setSubmitting(true);
      await resetPassword(password);
      navigate("/admin/login", {
        replace: true,
        state: { notice: "Password updated successfully. Please log in with your new password." },
      });
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!verified) return <RecoveryFrame><div className="admin-recovery-icon"><KeyRound size={20} /></div><h1>Verify your code first</h1><p className="admin-recovery-description">A valid, verified recovery code is required before you can reset the admin password.</p><Link className="admin-recovery-button" to={challenge ? "/admin/verify-code" : "/admin/forgot-password"}>{challenge ? "Continue verification" : "Start recovery"}</Link></RecoveryFrame>;

  return <RecoveryFrame><div className="admin-recovery-icon"><ShieldCheck size={20} /></div><h1>Reset Password</h1><p className="admin-recovery-description">Choose a new password for the admin account. Your verified code is valid for another {remainingMinutes ?? "…"} minute{remainingMinutes === 1 ? "" : "s"}.</p><Message>{error}</Message><form className="admin-recovery-form" onSubmit={submit}><PasswordInput label="New Password" value={password} onChange={(event) => setPassword(event.target.value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" /><PasswordInput label="Confirm Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} autoComplete="new-password" /><button className="admin-recovery-button" type="submit" disabled={submitting} aria-busy={submitting}>{submitting && <InlineSpinner label="Updating password" />}Update Password</button></form><Link className="admin-recovery-back" to="/admin/verify-code"><ArrowLeft size={14} /> Back to code verification</Link></RecoveryFrame>;
}
