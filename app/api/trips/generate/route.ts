import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateTicketReference } from '@/lib/utils'

// This endpoint generates trips and tickets for the next 6 months
// Should be run by admin or as a scheduled job

const ROUTES = [
  { time: '07:00', route: 'Whk - Walvis Bay' },
  { time: '07:00', route: 'W/Bay - Whk' },
  { time: '14:00', route: 'Whk - Walvis Bay' },
  { time: '14:00', route: 'W/Bay - Whk' },
]

const REGULAR_PRICE = 350
const DISCOUNT_PRICE = 300

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { startDate, endDate } = await request.json()

    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date()
    end.setMonth(end.getMonth() + 6) // Default to 6 months ahead

    const tripsCreated: any[] = []
    const ticketsCreated: any[] = []

    // Generate trips for each day
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      for (const routeConfig of ROUTES) {
        // Check if trip already exists
        const existingTrip = await prisma.trip.findUnique({
          where: {
            date_departureTime_route: {
              date: new Date(date),
              departureTime: routeConfig.time,
              route: routeConfig.route,
            },
          },
        })

        if (existingTrip) continue

        // Create trip
        const trip = await prisma.trip.create({
          data: {
            date: new Date(date),
            departureTime: routeConfig.time,
            route: routeConfig.route,
            totalSeats: 22,
          },
        })

        tripsCreated.push(trip)

        // Create 22 tickets for this trip
        for (let seatNumber = 1; seatNumber <= 22; seatNumber++) {
          const ticket = await prisma.ticket.create({
            data: {
              tripId: trip.id,
              seatNumber,
              referenceNumber: generateTicketReference(),
              price: REGULAR_PRICE,
              status: 'PENDING',
            },
          })

          ticketsCreated.push(ticket)
        }
      }
    }

    return NextResponse.json({
      success: true,
      tripsCreated: tripsCreated.length,
      ticketsCreated: ticketsCreated.length,
    })
  } catch (error) {
    console.error('Trip generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate trips' },
      { status: 500 }
    )
  }
}

