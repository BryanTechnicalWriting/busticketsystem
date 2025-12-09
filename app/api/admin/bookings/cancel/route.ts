import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { processRefund } from '@/lib/adumo'
import { z } from 'zod'

const cancelBookingSchema = z.object({
  bookingId: z.string(),
  reason: z.string().optional(),
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
    const { bookingId, reason } = cancelBookingSchema.parse(body)

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

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Booking already cancelled' },
        { status: 400 }
      )
    }

    // Process refund via Adumo
    if (booking.paymentReference) {
      const refundResult = await processRefund({
        paymentId: booking.paymentReference,
        amount: booking.price,
        reason: reason || 'Admin cancellation',
      })

      if (!refundResult.success) {
        return NextResponse.json(
          { error: refundResult.error || 'Refund failed' },
          { status: 400 }
        )
      }

      // Update booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'REFUNDED',
          refundReference: refundResult.refundId,
        },
      })

      // Update ticket
      await prisma.ticket.update({
        where: { id: booking.ticketId },
        data: {
          status: 'PENDING',
        },
      })

      // Remove booking relation from ticket
      await prisma.booking.delete({
        where: { id: bookingId },
      })

      return NextResponse.json({
        success: true,
        refundId: refundResult.refundId,
      })
    } else {
      // No payment reference, just cancel
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      })

      await prisma.ticket.update({
        where: { id: booking.ticketId },
        data: { status: 'PENDING' },
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}

