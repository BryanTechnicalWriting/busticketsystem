'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function MembershipSuccessPage() {
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [membershipNumber, setMembershipNumber] = useState<string | null>(null)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const membership = searchParams.get('membership')

    if (paymentId && membership) {
      setMembershipNumber(membership)
      verifyMembership(paymentId, membership)
    } else {
      setVerifying(false)
    }
  }, [searchParams])

  const verifyMembership = async (paymentId: string, membershipNumber: string) => {
    try {
      const response = await fetch('/api/membership/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, membershipNumber }),
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
        <p>Verifying your membership...</p>
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
              Membership Activated!
            </h1>
            <p className="text-gray-600 mb-4">
              Your membership has been successfully activated.
            </p>
            {membershipNumber && (
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Your Membership Number:</p>
                <p className="text-xl font-bold text-primary-700">
                  {membershipNumber}
                </p>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              You will receive a confirmation email with your membership details.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Go to Dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold mb-4 text-red-600">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue verifying your membership. Please contact support
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

