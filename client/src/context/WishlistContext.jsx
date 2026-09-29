/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const WishlistContext = createContext(null)
const readWishlist = () => {
  try { return JSON.parse(localStorage.getItem('mg-wishlist')) || [] } catch { return [] }
}
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(readWishlist)
  const save = useCallback((next) => { setIds(next); localStorage.setItem('mg-wishlist', JSON.stringify(next)) }, [])
  const addToWishlist = useCallback((id) => save(ids.includes(id) ? ids : [...ids, id]), [ids, save])
  const removeFromWishlist = useCallback((id) => save(ids.filter((item) => item !== id)), [ids, save])
  const isInWishlist = useCallback((id) => ids.includes(id), [ids])
  const value = useMemo(() => ({ ids, addToWishlist, removeFromWishlist, isInWishlist }), [ids, addToWishlist, removeFromWishlist, isInWishlist])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
export const useWishlist = () => useContext(WishlistContext)
