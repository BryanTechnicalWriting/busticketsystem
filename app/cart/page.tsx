'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  ticket: {
    id: string
    seatNumber: number
    price: number
    trip: {
      id: string
      date: string
      departureTime: string
      route: string
    }
  }
  expiresAt: string
}

export default function CartPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [discountType, setDiscountType] = useState<'NONE' | 'PENSIONER' | 'STUDENT'>('NONE')

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/cart')
      return
    }
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setCartItems(data.cartItems || [])
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (ticketId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/cart?ticketId=${ticketId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error)
    }
  }

  const handleCheckout = async () => {
    if (!token || cartItems.length === 0) return

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketIds: cartItems.map((item) => item.ticket.id),
          discountType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Booking confirmed. Manual payment required.')
        router.push('/dashboard')
      } else {
        alert(data.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed')
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.ticket.price, 0)
  const finalPrice = discountType !== 'NONE' ? total - cartItems.length * 50 : total

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <a
            href="/book"
            className="text-primary-600 hover:underline"
          >
            Browse available trips
          </a>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Items in Cart</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div>
                    <p className="font-semibold">{item.ticket.trip.route}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(item.ticket.trip.date)} at{' '}
                      {item.ticket.trip.departureTime}
                    </p>
                    <p className="text-sm text-gray-600">
                      Seat {item.ticket.seatNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">
                      {formatCurrency(item.ticket.price)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.ticket.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Discount Options</h2>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discount"
                  value="NONE"
                  checked={discountType === 'NONE'}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="mr-2"
                />
                No discount (Regular price)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discount"
                  value="PENSIONER"
                  checked={discountType === 'PENSIONER'}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="mr-2"
                />
                Pensioner (N$50 discount per ticket)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discount"
                  value="STUDENT"
                  checked={discountType === 'STUDENT'}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="mr-2"
                />
                Student (N$50 discount per ticket)
              </label>
            </div>
            {discountType !== 'NONE' && (
              <p className="mt-4 text-sm text-yellow-600">
                Note: You will need to upload proof of pensioner/student status
                during checkout. Your discount will be reviewed by our team.
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg">Subtotal:</span>
              <span className="text-lg font-semibold">
                {formatCurrency(total)}
              </span>
            </div>
            {discountType !== 'NONE' && (
              <div className="flex justify-between items-center mb-4 text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(cartItems.length * 50)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-6 pt-4 border-t">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-bold">
                {formatCurrency(finalPrice)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition text-lg font-semibold"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

