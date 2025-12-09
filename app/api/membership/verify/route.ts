import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPayment } from '@/lib/adumo'

export async function POST(request: NextRequest) {
  try {
    const { membershipNumber } = await request.json()

    // Update membership status to active
    const membership = await prisma.membership.update({
      where: { membershipNumber },
      data: { status: 'ACTIVE' },
    })

    return NextResponse.json({
      success: true,
      membership: {
        membershipNumber: membership.membershipNumber,
        status: membership.status,
        expiresAt: membership.expiresAt,
      },
    })
  } catch (error) {
    console.error('Membership verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

