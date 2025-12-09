import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { z } from 'zod'

const changeTimeSchema = z.object({
  bookingId: z.string(),
  newTripId: z.string(),
})

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

    const body = await request.json()
    const { bookingId, newTripId } = changeTimeSchema.parse(body)

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ticket: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get new trip and check for available tickets
    const newTrip = await prisma.trip.findUnique({
      where: { id: newTripId },
      include: {
        tickets: {
          where: {
            status: 'PENDING',
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
    })

    if (!newTrip) {
      return NextResponse.json(
        { error: 'New trip not found' },
        { status: 404 }
      )
    }

    const availableSeats = newTrip.totalSeats - newTrip._count.bookings
    if (availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No available seats on the new trip' },
        { status: 400 }
      )
    }

    // Find an available ticket in the new trip
    const availableTicket = newTrip.tickets.find(
      (ticket) => ticket.status === 'PENDING'
    )

    if (!availableTicket) {
      return NextResponse.json(
        { error: 'No available tickets on the new trip' },
        { status: 400 }
      )
    }

    // Free up old ticket
    await prisma.ticket.update({
      where: { id: booking.ticketId },
      data: { status: 'PENDING' },
    })

    // Update booking to new trip and ticket
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        tripId: newTripId,
        ticketId: availableTicket.id,
      },
      include: {
        trip: true,
        ticket: true,
        user: true,
      },
    })

    // Reserve new ticket
    await prisma.ticket.update({
      where: { id: availableTicket.id },
      data: { status: 'CONFIRMED' },
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Change time error:', error)
    return NextResponse.json(
      { error: 'Failed to change trip time' },
      { status: 500 }
    )
  }
}

