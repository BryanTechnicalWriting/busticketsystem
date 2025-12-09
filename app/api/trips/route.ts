import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const now = new Date()
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    const where: any = {
      date: {
        gte: startDate ? new Date(startDate) : now,
        lte: endDate ? new Date(endDate) : sixMonthsFromNow,
      },
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        tickets: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            seatNumber: true,
            price: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { departureTime: 'asc' },
      ],
    })

    // Calculate available seats for each trip
    const tripsWithAvailability = trips.map((trip) => {
      const bookedSeats = trip._count.bookings
      const availableSeats = trip.totalSeats - bookedSeats
      const availableTickets = trip.tickets.filter(
        (ticket) => ticket.status === 'PENDING'
      )

      return {
        id: trip.id,
        date: trip.date,
        departureTime: trip.departureTime,
        route: trip.route,
        totalSeats: trip.totalSeats,
        bookedSeats,
        availableSeats,
        availableTickets,
      }
    })

    return NextResponse.json({ trips: tripsWithAvailability })
  } catch (error) {
    console.error('Trips fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

