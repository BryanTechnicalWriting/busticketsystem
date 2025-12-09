import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateBookingReference } from '@/lib/utils'
import { initiatePayment } from '@/lib/adumo'
import { sendBookingConfirmation } from '@/lib/notifications'
import { z } from 'zod'

const createBookingSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
  discountType: z.enum(['NONE', 'PENSIONER', 'STUDENT']).optional(),
  discountDocuments: z.array(z.string()).optional(), // URLs of uploaded documents
})

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
  const { ticketIds, discountType = 'NONE', discountDocuments = [] } =
      createBookingSchema.parse(body)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { membership: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify all tickets are in user's cart and available
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
        ticketId: { in: ticketIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        ticket: {
          include: {
            trip: true,
            booking: true,
          },
        },
      },
    })

    if (cartItems.length !== ticketIds.length) {
      return NextResponse.json(
        { error: 'Some tickets are not in your cart or have expired' },
        { status: 400 }
      )
    }

    // Verify all tickets are available
    for (const item of cartItems) {
      if (item.ticket.status !== 'PENDING' || item.ticket.booking) {
        return NextResponse.json(
          { error: 'Some tickets are no longer available' },
          { status: 400 }
        )
      }
    }

    // Calculate total price
    const REGULAR_PRICE = 350
    const DISCOUNT_PRICE = 300
    const pricePerTicket =
      discountType !== 'NONE' ? DISCOUNT_PRICE : REGULAR_PRICE
    const totalAmount = pricePerTicket * ticketIds.length

    // Update tickets with discount info if applicable
    if (discountType !== 'NONE' && discountDocuments.length > 0) {
      for (let i = 0; i < cartItems.length; i++) {
        await prisma.ticket.update({
          where: { id: cartItems[i].ticketId },
          data: {
            price: DISCOUNT_PRICE,
            discountType,
            discountDocumentUrl: discountDocuments[i] || null,
          },
        })
      }
    }

    // Manual payment flow: directly confirm bookings
    const bookings = []
    for (const item of cartItems) {
      const bookingReference = generateBookingReference()
      const booking = await prisma.booking.create({
        data: {
          userId,
          tripId: item.ticket.tripId,
          ticketId: item.ticketId,
          referenceNumber: bookingReference,
          status: 'CONFIRMED',
          price: pricePerTicket,
          discountType,
          paymentReference: null,
        },
      })

      // Update ticket status
      await prisma.ticket.update({
        where: { id: item.ticketId },
        data: { status: 'CONFIRMED' },
      })

      bookings.push(booking)
    }

    // Remove items from cart
    await prisma.cartItem.deleteMany({
      where: {
        userId,
        ticketId: { in: ticketIds },
      },
    })

    // Send confirmations
    for (const booking of bookings) {
      const ticket = cartItems.find((c) => c.ticketId === booking.ticketId)?.ticket
      if (ticket) {
        await sendBookingConfirmation(
          user.email,
          user.phoneNumber || '',
          booking.referenceNumber,
          {
            date: ticket.trip.date,
            time: ticket.trip.departureTime,
            route: ticket.trip.route,
            seatNumber: ticket.seatNumber,
          }
        )
      }
    }

    return NextResponse.json({
      bookings,
      payment: null,
      message: 'Bookings confirmed (manual payment).',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

