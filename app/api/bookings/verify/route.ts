import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPayment } from '@/lib/adumo'
import { sendBookingConfirmation } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { bookingIds } = await request.json()

    if (!bookingIds || !Array.isArray(bookingIds)) {
      return NextResponse.json(
        { error: 'Booking IDs required' },
        { status: 400 }
      )
    }

    // Manual payment flow: mark specified bookings confirmed
    const bookings = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
      },
      data: {
        status: 'CONFIRMED',
      },
    })

    // Update tickets to confirmed
    const updatedBookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
      },
      include: {
        ticket: {
          include: {
            trip: true,
          },
        },
        user: true,
      },
    })

    await prisma.ticket.updateMany({
      where: {
        id: { in: updatedBookings.map((b) => b.ticketId) },
      },
      data: {
        status: 'CONFIRMED',
      },
    })

    // Send confirmation emails/SMS
    for (const booking of updatedBookings) {
      await sendBookingConfirmation(
        booking.user.email,
        booking.user.phoneNumber || '',
        booking.referenceNumber,
        {
          date: booking.trip.date,
          time: booking.trip.departureTime,
          route: booking.trip.route,
          seatNumber: booking.ticket.seatNumber,
        }
      )
    }

    return NextResponse.json({
      success: true,
      bookingsUpdated: bookings.count,
    })
  } catch (error) {
    console.error('Booking verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

