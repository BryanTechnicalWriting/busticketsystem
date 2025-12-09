import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateMembershipNumber, addYears } from '@/lib/utils'
import { initiatePayment } from '@/lib/adumo'
import { sendMembershipConfirmation } from '@/lib/notifications'
import { z } from 'zod'

const membershipSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  idNumber: z.string().min(1),
  dateOfBirth: z.string().transform((str: string) => new Date(str)),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = membershipSchema.parse(body)

    // Check if user already has an active membership
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You already have an active membership' },
        { status: 400 }
      )
    }

    // Generate membership number
    const membershipNumber = generateMembershipNumber()
    const expiresAt = addYears(new Date(), 2)

    // Create membership record and immediately activate (manual payment flow)
    const membership = await prisma.membership.create({
      data: {
        membershipNumber,
        userId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        idNumber: validated.idNumber,
        dateOfBirth: validated.dateOfBirth,
        email: validated.email,
        phoneNumber: validated.phoneNumber,
        expiresAt,
      },
    })

    // Manual payment flow: immediately send confirmation
    await sendMembershipConfirmation(
      validated.email,
      validated.phoneNumber,
      membershipNumber,
      expiresAt
    )

    return NextResponse.json({
      membership: {
        id: membership.id,
        membershipNumber: membership.membershipNumber,
        expiresAt: membership.expiresAt,
        status: membership.status,
      },
      payment: null,
      message: 'Membership created. Please record manual payment.',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Membership purchase error:', error)
    return NextResponse.json(
      { error: 'Membership purchase failed', details: message },
      { status: 500 }
    )
  }
}

