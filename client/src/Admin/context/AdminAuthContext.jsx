/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../../services/authService'

const AdminAuthContext = createContext(null)
const TOKEN_KEY = 'mg-admin-token'

export function AdminAuthProvider({ children }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => Boolean(window.localStorage.getItem(TOKEN_KEY)))
  const [admin, setAdmin] = useState(null)
  const [challenge, setChallenge] = useState(() => {
    try { return JSON.parse(window.sessionStorage.getItem('mg-admin-password-recovery')) } catch { return null }
  })

  useEffect(() => {
    let active = true
    const unauthorized = () => {
      setAdmin(null)
      setIsAdminAuthenticated(false)
      window.dispatchEvent(new Event('mg-admin-auth-changed'))
    }
    window.addEventListener('mg-admin-unauthorized', unauthorized)

    async function restoreSession() {
      try {
        const current = await authService.me()
        if (active) setAdmin(current)
      } catch {
        if (active) {
          window.localStorage.removeItem(TOKEN_KEY)
          setIsAdminAuthenticated(false)
        }
      }
    }
    if (window.localStorage.getItem(TOKEN_KEY)) {
      restoreSession()
    }

    return () => {
      active = false
      window.removeEventListener('mg-admin-unauthorized', unauthorized)
    }
  }, [])

  const clearRecovery = useCallback(() => {
    window.sessionStorage.removeItem('mg-admin-password-recovery')
    setChallenge(null)
  }, [])
  const beginRecovery = useCallback(async (email) => {
    await authService.forgotPassword(String(email).trim().toLowerCase())
    const next = { email: String(email).trim().toLowerCase(), expiresAt: Date.now() + 10 * 60 * 1000, verified: false, resetToken: '' }
    window.sessionStorage.setItem('mg-admin-password-recovery', JSON.stringify(next))
    setChallenge(next)
    return { ok: true }
  }, [])
  const resendCode = useCallback(async () => {
    if (!challenge?.email) return { ok: false }
    await authService.forgotPassword(challenge.email)
    const next = { email: challenge.email, expiresAt: Date.now() + 10 * 60 * 1000, verified: false, resetToken: '' }
    window.sessionStorage.setItem('mg-admin-password-recovery', JSON.stringify(next))
    setChallenge(next)
    return { ok: true }
  }, [challenge])
  const verifyCode = useCallback(async (code) => {
    if (!challenge?.email) return { ok: false, expired: true }
    const { resetToken } = await authService.verifyCode(challenge.email, code)
    const next = { ...challenge, verified: true, resetToken }
    window.sessionStorage.setItem('mg-admin-password-recovery', JSON.stringify(next))
    setChallenge(next)
    return { ok: true }
  }, [challenge])
  const resetPassword = useCallback(async (nextPassword) => {
    if (!challenge?.verified || !challenge.resetToken) return { ok: false }
    await authService.resetPassword(challenge.email, challenge.resetToken, nextPassword)
    clearRecovery()
    return { ok: true }
  }, [challenge, clearRecovery])
  const loginAdmin = useCallback(async (email, password) => {
    const result = await authService.login({ email: String(email).trim().toLowerCase(), password })
    window.localStorage.setItem(TOKEN_KEY, result.token)
    setAdmin(result.admin)
    setIsAdminAuthenticated(true)
    window.dispatchEvent(new Event('mg-admin-auth-changed'))
    return true
  }, [])
  const logoutAdmin = useCallback(async () => {
    try { await authService.logout() } finally {
      window.localStorage.removeItem(TOKEN_KEY)
      setAdmin(null)
      setIsAdminAuthenticated(false)
      window.dispatchEvent(new Event('mg-admin-auth-changed'))
    }
    return true
  }, [])
  const value = useMemo(() => ({
    admin, email: admin?.email || challenge?.email || '',
    isAdminAuthenticated, challenge, beginRecovery, resendCode, verifyCode,
    resetPassword, clearRecovery, loginAdmin, logoutAdmin,
    authenticate: loginAdmin,
    forgotPassword: beginRecovery,
    sendVerificationCode: beginRecovery,
    verifyVerificationCode: verifyCode,
    isVerificationCodeValid: () => Boolean(challenge && challenge.expiresAt > Date.now()),
    isPasswordResetAllowed: () => Boolean(challenge?.verified && challenge.expiresAt > Date.now()),
  }), [admin, challenge, isAdminAuthenticated, beginRecovery, resendCode, verifyCode, resetPassword, clearRecovery, loginAdmin, logoutAdmin])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used inside AdminAuthProvider.')
  return context
}
