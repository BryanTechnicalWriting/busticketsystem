import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { addHours } from '@/lib/utils'
import { z } from 'zod'

const addToCartSchema = z.object({
  ticketId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId } = addToCartSchema.parse(body)

    // Check if ticket exists and is available
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        trip: true,
        booking: true,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    if (ticket.status !== 'PENDING' || ticket.booking) {
      return NextResponse.json(
        { error: 'Ticket is not available' },
        { status: 400 }
      )
    }

    // Check if ticket is already in user's cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_ticketId: {
          userId,
          ticketId,
        },
      },
    })

    if (existingCartItem) {
      return NextResponse.json({
        message: 'Ticket already in cart',
        cartItem: existingCartItem,
      })
    }

    // Add to cart (expires in 24 hours)
    const cartItem = await prisma.cartItem.create({
      data: {
        userId,
        ticketId,
        expiresAt: addHours(new Date(), 24),
      },
      include: {
        ticket: {
          include: {
            trip: true,
          },
        },
      },
    })

    return NextResponse.json({ cartItem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

