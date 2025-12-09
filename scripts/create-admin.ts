// Script to create an admin user
// Run with: npx ts-node scripts/create-admin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2] || 'admin@carloshuttle.com'
  const password = process.argv[3] || 'admin123'
  const firstName = process.argv[4] || 'Admin'
  const lastName = process.argv[5] || 'User'

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
      },
      create: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
      },
    })

    console.log('Admin user created/updated:')
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.firstName} ${user.lastName}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

