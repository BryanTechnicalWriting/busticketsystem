import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 text-primary-700">
          Welcome to Carlos Shuttle
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Your reliable transportation between Windhoek and Walvis Bay
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Book a Ticket</h2>
            <p className="text-gray-600 mb-6">
              Book your bus ticket for any of our daily trips. Available up to 6
              months in advance.
            </p>
            <Link
              href="/book"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Book Now
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Become a Member</h2>
            <p className="text-gray-600 mb-6">
              Join our membership program for N$150 per 2 years and enjoy
              exclusive promotions and discounts.
            </p>
            <Link
              href="/membership"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Join Now
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Daily Schedule</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h3 className="font-semibold mb-2">Morning Departures (07:00)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Windhoek → Walvis Bay</li>
                <li>• Walvis Bay → Windhoek</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Afternoon Departures (14:00)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Windhoek → Walvis Bay</li>
                <li>• Walvis Bay → Windhoek</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            22 seats available per trip • 88 total seats per day
          </p>
        </div>
      </div>
    </div>
  )
}

