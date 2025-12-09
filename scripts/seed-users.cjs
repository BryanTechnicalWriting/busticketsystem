// Seed basic users (one passenger and one admin) into the database.
// Run with:
//   node scripts/seed-users.cjs

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passengerEmail = 'passenger@example.com'
  const passengerPassword = 'pass1234'

  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin1234'

  const passengerHashed = await bcrypt.hash(passengerPassword, 10)
  const adminHashed = await bcrypt.hash(adminPassword, 10)

  // Passenger / normal user
  const passenger = await prisma.user.upsert({
    where: { email: passengerEmail },
    update: {},
    create: {
      email: passengerEmail,
      password: passengerHashed,
      firstName: 'Test',
      lastName: 'Passenger',
      role: 'USER',
    },
  })

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      password: adminHashed,
    },
    create: {
      email: adminEmail,
      password: adminHashed,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  })

  console.log('Seeded / updated users:')
  console.log(`Passenger -> email: ${passenger.email}  password: ${passengerPassword}`)
  console.log(`Admin     -> email: ${admin.email}      password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('Error seeding users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


