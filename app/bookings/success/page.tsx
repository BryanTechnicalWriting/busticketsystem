'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function BookingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const bookingIds = searchParams.get('bookingIds')

    if (paymentId && bookingIds) {
      verifyBooking(paymentId, JSON.parse(bookingIds))
    } else {
      setVerifying(false)
    }
  }, [searchParams])

  const verifyBooking = async (paymentId: string, bookingIds: string[]) => {
    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, bookingIds }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        setSuccess(false)
      }
    } catch (error) {
      console.error('Verification error:', error)
      setSuccess(false)
    } finally {
      setVerifying(false)
    }
  }

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Verifying your booking...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {success ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-4 text-green-600">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 mb-6">
              Your booking has been successfully confirmed. You will receive a
              confirmation email shortly.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              View My Trips
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold mb-4 text-red-600">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue verifying your booking. Please contact support
              if you have been charged.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

