'use client'

import Link from 'next/link'

export default function MembershipCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold mb-4">Membership Purchase Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your membership purchase was cancelled. No charges have been made to your account.
        </p>
        <Link
          href="/membership"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}

