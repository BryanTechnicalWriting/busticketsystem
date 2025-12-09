

## Features

### Membership System
- Purchase membership for N$150 per 2 years
- Digital membership number generation
- Member database with personal information
- Email/SMS notifications for promotions
- Payment processing via Adumo payment gateway

### Bus Ticket Booking
- Daily schedule: 4 trips per day (07:00 and 14:00, both directions)
- 22 seats per trip, 88 total seats per day
- Book tickets up to 6 months in advance
- Shopping cart with 24-hour expiration
- Pricing: N$350 regular, N$300 for pensioners/students (with ID upload)
- Payment processing via Adumo
- View upcoming and past trips

### Admin Backend
- View all bookings with detailed information
- Cancel bookings with automatic refund processing
- Change trip departure times
- Manual booking for existing users
- Live passenger roster for each trip

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **Payment**: Adumo payment gateway integration
- **Notifications**: Twilio (SMS) and SendGrid (Email)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `ADUMO_API_KEY`, `ADUMO_API_SECRET`, `ADUMO_MERCHANT_ID`: Adumo payment gateway credentials
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Twilio SMS credentials
   - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`: SendGrid email credentials
   - `NEXT_PUBLIC_APP_URL`: Your application URL

3. **Set up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Generate Initial Trips and Tickets**
   Run the trip generation endpoint (requires admin access):
   ```bash
   # This should be done via the admin panel or API
   POST /api/trips/generate
   ```

5. **Create Admin User**
   You'll need to manually create an admin user in the database or add an admin creation endpoint.

6. **Run Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at http://localhost:3000

## Project Structure

```
Booking app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── membership/   # Membership endpoints
│   │   ├── trips/        # Trip management
│   │   ├── cart/         # Shopping cart
│   │   ├── bookings/     # Booking management
│   │   └── admin/        # Admin endpoints
│   ├── book/             # Booking page
│   ├── cart/             # Shopping cart page
│   ├── dashboard/        # User dashboard
│   ├── membership/       # Membership purchase
│   ├── admin/            # Admin dashboard
│   └── ...
├── components/           # React components
├── lib/                  # Utility functions
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Authentication utilities
│   ├── adumo.ts         # Payment gateway integration
│   ├── notifications.ts # Email/SMS utilities
│   └── utils.ts         # General utilities
└── prisma/
    └── schema.prisma    # Database schema
```

## Important Notes

1. **Adumo Integration**: The Adumo payment gateway integration is structured but requires actual API documentation from Adumo to complete. Update the endpoints and request/response formats in `lib/adumo.ts` based on Adumo's actual API.

2. **Trip Generation**: Trips and tickets need to be generated for the next 6 months. This can be done via the admin endpoint `/api/trips/generate` or set up as a scheduled job.

3. **Cart Expiration**: Cart items expire after 24 hours. A cleanup job should run periodically to remove expired items.

4. **File Uploads**: The pensioner/student ID upload functionality needs to be implemented with a file storage solution (e.g., AWS S3, Cloudinary, or local storage).

5. **Admin Access**: Create an admin user manually in the database or add an admin creation endpoint.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Membership
- `POST /api/membership/purchase` - Purchase membership
- `POST /api/membership/verify` - Verify membership payment

### Trips
- `GET /api/trips` - Get available trips
- `POST /api/trips/generate` - Generate trips (admin only)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add ticket to cart
- `DELETE /api/cart` - Remove from cart

### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings/create` - Create booking
- `POST /api/bookings/verify` - Verify booking payment

### Admin
- `GET /api/admin/bookings` - Get all bookings
- `POST /api/admin/bookings/cancel` - Cancel booking
- `POST /api/admin/bookings/change-time` - Change trip time
- `POST /api/admin/bookings/manual` - Manual booking
- `GET /api/admin/trips/roster` - Get trip roster

## License

This project is proprietary software for Carlos Shuttle.

