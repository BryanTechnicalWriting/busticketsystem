import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up expired cart items
    await prisma.cartItem.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
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

    // Filter out tickets that are no longer available
    const availableItems = cartItems.filter(
      (item) => item.ticket.status === 'PENDING' && !item.ticket.booking
    )

    return NextResponse.json({ cartItems: availableItems })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')

    if (ticketId) {
      // Remove specific item
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          ticketId,
        },
      })
    } else {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: { userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart delete error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    )
  }
}

