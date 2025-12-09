import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'upcoming' or 'past'

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()

    const where: any = {
      userId,
      status: { in: ['CONFIRMED', 'PENDING'] },
    }

    if (type === 'upcoming') {
      where.trip = {
        date: { gte: now },
      }
    } else if (type === 'past') {
      where.trip = {
        date: { lt: now },
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: true,
        ticket: true,
        user: {
          include: {
            membership: true,
          },
        },
      },
      orderBy: {
        trip: {
          date: type === 'upcoming' ? 'asc' : 'desc',
        },
      },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

