/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UIContext = createContext(null)
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((items) => [...items, { id, message, type }])
    window.setTimeout(() => setToasts((items) => items.filter((toast) => toast.id !== id)), 3200)
  }, [])
  const value = useMemo(() => ({ toasts, notify, cartOpen, setCartOpen, menuOpen, setMenuOpen }), [toasts, notify, cartOpen, menuOpen])
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
export const useUI = () => useContext(UIContext)
