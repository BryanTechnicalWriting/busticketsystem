'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Booking {
  id: string
  referenceNumber: string
  status: string
  price: number
  discountType: string
  paymentReference?: string
  user: {
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    membership?: {
      membershipNumber: string
    } | null
  }
  trip: {
    id: string
    date: string
    departureTime: string
    route: string
  }
  ticket: {
    seatNumber: number
  }
}

export default function AdminPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTripId, setSelectedTripId] = useState<string>('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchBookings()
  }, [user, selectedTripId])

  const fetchBookings = async () => {
    if (!token) return

    try {
      const url = selectedTripId
        ? `/api/admin/bookings?tripId=${selectedTripId}`
        : '/api/admin/bookings'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!token || !confirm('Are you sure you want to cancel this booking?'))
      return

    try {
      const response = await fetch('/api/admin/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      })

      if (response.ok) {
        alert('Booking cancelled and refund processed')
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Cancel booking error:', error)
      alert('Failed to cancel booking')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by Trip ID (optional)"
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking Ref
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Passenger
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trip Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Membership
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {booking.referenceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium">
                      {booking.user.firstName} {booking.user.lastName}
                    </div>
                    <div className="text-gray-500">{booking.user.email}</div>
                    {booking.user.phoneNumber && (
                      <div className="text-gray-500">
                        {booking.user.phoneNumber}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium">{booking.trip.route}</div>
                    <div className="text-gray-500">
                      {formatDate(booking.trip.date)} at{' '}
                      {booking.trip.departureTime}
                    </div>
                    <div className="text-gray-500">
                      Seat {booking.ticket.seatNumber}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {booking.user.membership?.membershipNumber || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatCurrency(booking.price)}
                  {booking.discountType !== 'NONE' && (
                    <div className="text-xs text-gray-500">
                      ({booking.discountType})
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

