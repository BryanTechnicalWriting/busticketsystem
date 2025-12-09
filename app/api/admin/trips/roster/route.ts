import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID required' },
        { status: 400 }
      )
    }

    // Get trip with all bookings
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
          include: {
            user: {
              include: {
                membership: true,
              },
            },
            ticket: true,
          },
          orderBy: {
            ticket: {
              seatNumber: 'asc',
            },
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Format roster
    const roster = trip.bookings.map((booking) => ({
      seatNumber: booking.ticket.seatNumber,
      passenger: {
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        phone: booking.user.phoneNumber,
        membershipNumber: booking.user.membership?.membershipNumber || null,
      },
      bookingReference: booking.referenceNumber,
      price: booking.price,
      discountType: booking.discountType,
    }))

    return NextResponse.json({
      trip: {
        id: trip.id,
        date: trip.date,
        departureTime: trip.departureTime,
        route: trip.route,
        totalSeats: trip.totalSeats,
        bookedSeats: trip.bookings.length,
        availableSeats: trip.totalSeats - trip.bookings.length,
      },
      roster,
    })
  } catch (error) {
    console.error('Roster fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roster' },
      { status: 500 }
    )
  }
}

