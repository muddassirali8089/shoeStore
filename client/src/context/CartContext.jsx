/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)
const readCart = () => {
  try { return JSON.parse(localStorage.getItem('mg-cart')) || [] } catch { return [] }
}
export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)
  const save = useCallback((next) => { setItems(next); localStorage.setItem('mg-cart', JSON.stringify(next)) }, [])
  const addToCart = useCallback((product, size, quantity = 1) => {
    const key = `${product.id}-${size || 'one-size'}`
    const found = items.find((item) => item.key === key)
    save(found ? items.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { key, productId: product.id, size, price: product.price, originalPrice: product.originalPrice, quantity }])
  }, [items, save])
  const removeFromCart = useCallback((key) => save(items.filter((item) => item.key !== key)), [items, save])
  const updateQuantity = useCallback((key, quantity) => quantity <= 0 ? removeFromCart(key) : save(items.map((item) => item.key === key ? { ...item, quantity } : item)), [items, removeFromCart, save])
  const clearCart = useCallback(() => save([]), [save])
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.originalPrice || item.price || 0) * item.quantity, 0)
  const discount = items.reduce((sum, item) => sum + Math.max(0, (item.originalPrice || item.price || 0) - (item.price || 0)) * item.quantity, 0)
  const shipping = subtotal - discount === 0 || subtotal - discount >= 25000 ? 0 : 350
  const total = subtotal - discount + shipping
  const value = useMemo(() => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, count, subtotal, discount, shipping, total }), [items, addToCart, removeFromCart, updateQuantity, clearCart, count, subtotal, discount, shipping, total])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
export const useCart = () => useContext(CartContext)
