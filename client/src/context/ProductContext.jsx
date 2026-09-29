/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react'
import { products } from '../data/products'

const ProductContext = createContext(null)
export function ProductProvider({ children }) {
  const value = useMemo(() => ({ products }), [])
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}
export const useProducts = () => useContext(ProductContext)
