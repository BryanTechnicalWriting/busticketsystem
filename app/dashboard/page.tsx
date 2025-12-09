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
  trip: {
    date: string
    departureTime: string
    route: string
  }
  ticket: {
    seatNumber: number
  }
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchBookings()
  }, [user, activeTab])

  const fetchBookings = async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/bookings?type=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (activeTab === 'upcoming') {
        setUpcomingBookings(data.bookings || [])
      } else {
        setPastBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">My Trips</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'upcoming'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Upcoming Trips
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'past'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Past Trips
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {booking.trip.route}
                  </h2>
                  <p className="text-gray-600 mb-1">
                    {formatDate(booking.trip.date)} at {booking.trip.departureTime}
                  </p>
                  <p className="text-gray-600 mb-1">
                    Seat {booking.ticket.seatNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Reference: {booking.referenceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold mb-2">
                    {formatCurrency(booking.price)}
                  </p>
                  <span
                    className={`px-3 py-1 rounded ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user?.membership && (
        <div className="mt-8 bg-primary-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2">Membership Status</h2>
          <p className="text-gray-600">
            Membership Number: {user.membership.membershipNumber}
          </p>
          <p className="text-gray-600">
            Status: {user.membership.status}
          </p>
          <p className="text-gray-600">
            Expires: {formatDate(user.membership.expiresAt)}
          </p>
        </div>
      )}
    </div>
  )
}

