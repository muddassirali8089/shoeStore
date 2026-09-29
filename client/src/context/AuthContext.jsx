/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const readUser = () => {
  try { return JSON.parse(localStorage.getItem('mg-user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const login = useCallback(async (email, password) => {
    if (!email || !password) throw new Error('Enter your email and password.')
    await new Promise((resolve) => setTimeout(resolve, 450))
    const next = { name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()), email }
    localStorage.setItem('mg-user', JSON.stringify(next))
    setUser(next)
    return next
  }, [])
  const register = useCallback(async (name, email, password, phone = '') => {
    if (!name || !email || !password) throw new Error('Please complete all required fields.')
    await new Promise((resolve) => setTimeout(resolve, 450))
    const next = { name, email, phone }
    localStorage.setItem('mg-user', JSON.stringify(next))
    setUser(next)
    return next
  }, [])
  const logout = useCallback(() => { localStorage.removeItem('mg-user'); setUser(null) }, [])
  const updateProfile = useCallback((profile) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...profile }
      localStorage.setItem('mg-user', JSON.stringify(next))
      return next
    })
  }, [])
  const value = useMemo(() => ({ user, login, register, logout, updateProfile }), [user, login, register, logout, updateProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
