// Script to clean up expired cart items
// This should be run as a scheduled job (cron) every hour
// Run with: npx ts-node scripts/cleanup-cart.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupCart() {
  try {
    const result = await prisma.cartItem.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    console.log(`Cleaned up ${result.count} expired cart items`)
  } catch (error) {
    console.error('Error cleaning up cart:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupCart()

