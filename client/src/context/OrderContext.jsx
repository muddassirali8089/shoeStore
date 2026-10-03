/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { orderService } from '../services/orderService'

const OrderContext = createContext(null)

export function OrderProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastOrder, setLastOrder] = useState(null)

  const placeGuestCodOrder = useCallback(async (form, cartItems) => {
    setLoading(true)
    setError('')
    try {
      const order = await orderService.create({
        paymentMethod: 'cash_on_delivery',
        customer: {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
        },
        shippingAddress: {
          address: form.address,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
        },
        orderNotes: form.notes,
        items: cartItems.map(({ productId, size, quantity }) => ({
          product: productId, size: Number(size), quantity: Number(quantity),
        })),
      })
      if (!order?.orderNumber || !Number.isFinite(Number(order.total))) {
        throw new Error('The server did not return a valid order confirmation.')
      }
      const confirmed = {
        ...order,
        id: order.orderNumber,
        status: order.orderStatus || 'pending',
        date: order.createdAt || new Date().toISOString(),
        customer: { ...order.customer, fullName: order.customer?.name || form.fullName },
      }
      setLastOrder(confirmed)
      try { window.sessionStorage.setItem('mg-last-order', JSON.stringify(confirmed)) } catch { /* In-memory confirmation remains available. */ }
      return confirmed
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [])

  const trackOrder = useCallback(async (orderNumber, phone) => {
    setLoading(true)
    setError('')
    try {
      return await orderService.track(orderNumber, phone)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(() => ({ loading, error, lastOrder, placeGuestCodOrder, trackOrder }), [loading, error, lastOrder, placeGuestCodOrder, trackOrder])
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrders must be used inside OrderProvider.')
  return context
}
