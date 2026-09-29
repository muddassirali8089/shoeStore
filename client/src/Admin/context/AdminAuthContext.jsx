/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);

export const ADMIN_EMAIL = "admin@example.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";
const PASSWORD_KEY = "mg-admin-password";
const CHALLENGE_KEY = "mg-admin-password-recovery";
const CODE_LIFETIME = 5 * 60 * 1000;

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getStorage(type) {
  try {
    return typeof window === "undefined" ? null : window[type];
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function getChallenge() {
  const storage = getStorage("sessionStorage");
  if (!storage) return null;
  const challenge = readJson(storage, CHALLENGE_KEY, null);
  if (!challenge || typeof challenge !== "object") return null;
  if (challenge.email !== ADMIN_EMAIL || !/^\d{6}$/.test(challenge.code)) return null;
  if (!Number.isFinite(challenge.expiresAt) || typeof challenge.verified !== "boolean") return null;
  return challenge;
}

function generateCode() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return String(values[0] % 1000000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

export function AdminAuthProvider({ children }) {
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
    try {
      return window.localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
    } catch {
      return DEFAULT_ADMIN_PASSWORD;
    }
  });
  const [challenge, setChallenge] = useState(getChallenge);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("mg-admin") === "true"; } catch { return false; }
  });

  const beginRecovery = useCallback((email) => {
    if (String(email).trim().toLowerCase() !== ADMIN_EMAIL) return { ok: false };
    const next = { email: ADMIN_EMAIL, code: generateCode(), expiresAt: Date.now() + CODE_LIFETIME, verified: false };
    const storage = getStorage("sessionStorage");
    if (!storage || !writeJson(storage, CHALLENGE_KEY, next)) {
      return { ok: false, storageError: true };
    }
    setChallenge(next);
    return { ok: true, demoCode: next.code };
  }, []);
  const resendCode = useCallback(() => {
    if (!challenge || challenge.email !== ADMIN_EMAIL) return { ok: false };
    const next = { email: ADMIN_EMAIL, code: generateCode(), expiresAt: Date.now() + CODE_LIFETIME, verified: false };
    const storage = getStorage("sessionStorage");
    if (!storage || !writeJson(storage, CHALLENGE_KEY, next)) {
      return { ok: false, storageError: true };
    }
    setChallenge(next);
    return { ok: true, demoCode: next.code };
  }, [challenge]);
  const verifyCode = useCallback((code) => {
    const current = getChallenge();
    if (!current || current.expiresAt <= Date.now()) return { ok: false, expired: true };
    if (String(code) !== current.code) return { ok: false, expired: false };
    const verified = { ...current, verified: true };
    const storage = getStorage("sessionStorage");
    if (!storage || !writeJson(storage, CHALLENGE_KEY, verified)) {
      return { ok: false, storageError: true };
    }
    setChallenge(verified);
    return { ok: true };
  }, []);
  const clearRecovery = useCallback(() => {
    const storage = getStorage("sessionStorage");
    if (!storage) return false;
    try {
      storage.removeItem(CHALLENGE_KEY);
    } catch {
      return false;
    }
    setChallenge(null);
    return true;
  }, []);

  const value = useMemo(() => ({
    email: ADMIN_EMAIL,
    password,
    challenge,
    isAdminAuthenticated,
    beginRecovery,
    resendCode,
    verifyCode,
    resetPassword(nextPassword) {
      const current = getChallenge();
      if (!current?.verified || current.expiresAt <= Date.now()) {
        return { ok: false };
      }
      if (nextPassword.length < 8) return { ok: false, validationError: true };
      const challengeStorage = getStorage("sessionStorage");
      const localStorage = getStorage("localStorage");
      if (!challengeStorage || !localStorage) return { ok: false, storageError: true };
      try {
        challengeStorage.removeItem(CHALLENGE_KEY);
      } catch {
        return { ok: false, storageError: true };
      }
      setChallenge(null);
      try {
        // Frontend demo only — never store real passwords this way in production.
        localStorage.setItem("mg-admin", "false");
        setIsAdminAuthenticated(false);
        localStorage.setItem(PASSWORD_KEY, nextPassword);
      } catch {
        return { ok: false, storageError: true };
      }
      setPassword(nextPassword);
      return { ok: true };
    },
    clearRecovery,
    authenticate(email, candidatePassword) {
      return String(email).trim().toLowerCase() === ADMIN_EMAIL && candidatePassword === password;
    },
    loginAdmin(email, candidatePassword) {
      if (String(email).trim().toLowerCase() !== ADMIN_EMAIL || candidatePassword !== password) return false;
      try {
        window.localStorage.setItem("mg-admin", "true");
      } catch {
        return null;
      }
      setIsAdminAuthenticated(true);
      return true;
    },
    logoutAdmin() {
      try {
        window.localStorage.setItem("mg-admin", "false");
      } catch {
        return false;
      }
      setIsAdminAuthenticated(false);
      return true;
    },
    forgotPassword(email) {
      return beginRecovery(email);
    },
    sendVerificationCode(email) {
      return beginRecovery(email);
    },
    verifyVerificationCode(code) {
      return verifyCode(code);
    },
    isVerificationCodeValid() {
      const current = getChallenge();
      return Boolean(current && current.expiresAt > Date.now());
    },
    isPasswordResetAllowed() {
      const current = getChallenge();
      return Boolean(current?.verified && current.expiresAt > Date.now());
    },
  }), [password, challenge, isAdminAuthenticated, beginRecovery, resendCode, verifyCode, clearRecovery]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return context;
}
