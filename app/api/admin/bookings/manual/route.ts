import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateBookingReference } from '@/lib/utils'
import { z } from 'zod'

const manualBookingSchema = z.object({
  userId: z.string(),
  tripId: z.string(),
  seatNumber: z.number().optional(),
  price: z.number().optional(),
  discountType: z.enum(['NONE', 'PENSIONER', 'STUDENT']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const adminUserId = getUserIdFromRequest(request)
    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, tripId, seatNumber, price, discountType = 'NONE' } =
      manualBookingSchema.parse(body)

    // Get trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
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

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check availability
    const availableSeats = trip.totalSeats - trip._count.bookings
    if (availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No available seats on this trip' },
        { status: 400 }
      )
    }

    // Find ticket
    let ticket
    if (seatNumber) {
      ticket = trip.tickets.find((t) => t.seatNumber === seatNumber)
      if (!ticket || ticket.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Requested seat is not available' },
          { status: 400 }
        )
      }
    } else {
      ticket = trip.tickets.find((t) => t.status === 'PENDING')
      if (!ticket) {
        return NextResponse.json(
          { error: 'No available tickets' },
          { status: 400 }
        )
      }
    }

    const finalPrice = price || (discountType !== 'NONE' ? 300 : 350)

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        tripId,
        ticketId: ticket.id,
        referenceNumber: generateBookingReference(),
        status: 'CONFIRMED',
        price: finalPrice,
        discountType,
      },
      include: {
        user: {
          include: {
            membership: true,
          },
        },
        trip: true,
        ticket: true,
      },
    })

    // Update ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'CONFIRMED',
        price: finalPrice,
        discountType,
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Manual booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create manual booking' },
      { status: 500 }
    )
  }
}

