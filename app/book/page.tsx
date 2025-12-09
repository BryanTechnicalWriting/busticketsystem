'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Trip {
  id: string
  date: string
  departureTime: string
  route: string
  totalSeats: number
  bookedSeats: number
  availableSeats: number
  availableTickets: Array<{
    id: string
    seatNumber: number
    price: number
  }>
}

export default function BookPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/book')
      return
    }

    fetchTrips()
  }, [user])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      const data = await response.json()
      setTrips(data.trips || [])
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (ticketId: string) => {
    if (!token) return

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketId }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('Ticket added to cart!')
        setSelectedTickets([...selectedTickets, ticketId])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading trips...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Book a Ticket</h1>
        <Link
          href="/cart"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          View Cart
        </Link>
      </div>

      <div className="grid gap-6">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{trip.route}</h2>
                <p className="text-gray-600">
                  {formatDate(trip.date)} at {trip.departureTime}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {trip.availableSeats} of {trip.totalSeats} seats available
                </p>
              </div>
            </div>

            {trip.availableSeats > 0 ? (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Available Seats:</h3>
                <div className="grid grid-cols-11 gap-2">
                  {trip.availableTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleAddToCart(ticket.id)}
                      disabled={selectedTickets.includes(ticket.id)}
                      className={`px-3 py-2 rounded ${
                        selectedTickets.includes(ticket.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 hover:bg-primary-500 hover:text-white'
                      } transition`}
                    >
                      {ticket.seatNumber}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Price: {formatCurrency(trip.availableTickets[0]?.price || 350)}
                </p>
              </div>
            ) : (
              <p className="text-red-600 font-semibold">Fully Booked</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

