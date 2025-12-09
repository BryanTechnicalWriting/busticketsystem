// Generate trips and tickets based on the fixed daily schedule:
//  - 07:00  Whk - Walvis Bay
//  - 07:00  W/Bay - Whk
//  - 14:00  Whk - Walvis Bay
//  - 14:00  W/Bay - Whk
//
// For each calendar day it creates 4 trips * 22 seats = 88 tickets.
// By default it generates trips from today up to 6 months in the future.
//
// Run with:
//   node scripts/generate-trips.cjs

const { PrismaClient } = require('@prisma/client')
const { addMonths, startOfDay } = require('date-fns')

const prisma = new PrismaClient()

const ROUTES = [
  { time: '07:00', route: 'Whk - Walvis Bay' },
  { time: '07:00', route: 'W/Bay - Whk' },
  { time: '14:00', route: 'Whk - Walvis Bay' },
  { time: '14:00', route: 'W/Bay - Whk' },
]

const REGULAR_PRICE = 350

let ticketCounter = 0
function generateTicketReference() {
  // Deterministic-ish unique reference using timestamp + counter
  const now = Date.now().toString(36).toUpperCase()
  ticketCounter += 1
  const counterPart = ticketCounter.toString(36).toUpperCase().padStart(3, '0')
  return `T${now}${counterPart}`
}

async function main() {
  const today = startOfDay(new Date())
  const end = addMonths(today, 6) // 6 months ahead

  const tripsCreated = []
  const ticketsCreated = []

  for (
    let date = new Date(today);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dayDate = startOfDay(date)

    for (const routeConfig of ROUTES) {
      // Check if this exact trip already exists (date + time + route)
      const existingTrip = await prisma.trip.findUnique({
        where: {
          date_departureTime_route: {
            date: dayDate,
            departureTime: routeConfig.time,
            route: routeConfig.route,
          },
        },
      })

      if (existingTrip) continue

      const trip = await prisma.trip.create({
        data: {
          date: dayDate,
          departureTime: routeConfig.time,
          route: routeConfig.route,
          totalSeats: 22,
        },
      })
      tripsCreated.push(trip.id)

      // Create 22 tickets with unique reference numbers
      const ticketData = []
      for (let seatNumber = 1; seatNumber <= 22; seatNumber++) {
        ticketData.push({
          tripId: trip.id,
          seatNumber,
          referenceNumber: generateTicketReference(),
          price: REGULAR_PRICE,
          status: 'PENDING',
        })
      }

      for (const data of ticketData) {
        const ticket = await prisma.ticket.create({ data })
        ticketsCreated.push(1)
      }
    }
  }

  const totalTrips = tripsCreated.length
  const totalTickets = ticketsCreated.reduce((sum, c) => sum + c, 0)

  console.log(
    `Generated ${totalTrips} trips and ${totalTickets} tickets (up to 6 months ahead).`
  )
}

main()
  .catch((e) => {
    console.error('Error generating trips:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


