// Notification service using Twilio (SMS) and SendGrid (Email)

import twilio from 'twilio'
import sgMail from '@sendgrid/mail'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@carloshuttlenamibia.com'

// Initialize Twilio client
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, SMS not sent')
    return false
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to,
    })
    return true
  } catch (error) {
    console.error('SMS sending error:', error)
    return false
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured, email not sent')
    return false
  }

  try {
    await sgMail.send({
      to,
      from: SENDGRID_FROM_EMAIL,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      html: htmlContent,
    })
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

export async function sendMembershipConfirmation(
  email: string,
  phone: string,
  membershipNumber: string,
  expiryDate: Date
): Promise<void> {
  const emailSubject = 'Welcome to Carlos Shuttle Membership!'
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Carlos Shuttle!</h2>
      <p>Thank you for purchasing a membership. Your membership details are:</p>
      <ul>
        <li><strong>Membership Number:</strong> ${membershipNumber}</li>
        <li><strong>Expires:</strong> ${expiryDate.toLocaleDateString()}</li>
      </ul>
      <p>You can now enjoy exclusive promotions and benefits as a member!</p>
      <p>Best regards,<br>Carlos Shuttle Team</p>
    </div>
  `

  const smsMessage = `Welcome to Carlos Shuttle! Your membership number is ${membershipNumber}. Valid until ${expiryDate.toLocaleDateString()}.`

  await Promise.all([
    sendEmail(email, emailSubject, emailHtml),
    sendSMS(phone, smsMessage),
  ])
}

export async function sendBookingConfirmation(
  email: string,
  phone: string,
  bookingReference: string,
  tripDetails: {
    date: Date
    time: string
    route: string
    seatNumber: number
  }
): Promise<void> {
  const emailSubject = 'Your Carlos Shuttle Booking Confirmation'
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Your bus ticket has been confirmed. Details:</p>
      <ul>
        <li><strong>Booking Reference:</strong> ${bookingReference}</li>
        <li><strong>Date:</strong> ${tripDetails.date.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${tripDetails.time}</li>
        <li><strong>Route:</strong> ${tripDetails.route}</li>
        <li><strong>Seat:</strong> ${tripDetails.seatNumber}</li>
      </ul>
      <p>Please arrive at least 15 minutes before departure.</p>
      <p>Best regards,<br>Carlos Shuttle Team</p>
    </div>
  `

  const smsMessage = `Booking confirmed! Ref: ${bookingReference}. ${tripDetails.date.toLocaleDateString()} at ${tripDetails.time}, ${tripDetails.route}, Seat ${tripDetails.seatNumber}.`

  await Promise.all([
    sendEmail(email, emailSubject, emailHtml),
    sendSMS(phone, smsMessage),
  ])
}

export async function sendPromotionToMembers(
  promotion: {
    title: string
    description: string
    discountPercent?: number
    priceFreeze?: boolean
  },
  memberEmails: string[],
  memberPhones: string[]
): Promise<void> {
  const emailSubject = `🎉 Exclusive Promotion: ${promotion.title}`
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${promotion.title}</h2>
      <p>${promotion.description}</p>
      ${promotion.discountPercent ? `<p><strong>${promotion.discountPercent}% discount!</strong></p>` : ''}
      ${promotion.priceFreeze ? `<p><strong>Price freeze active!</strong></p>` : ''}
      <p>Use your membership number to redeem this promotion.</p>
      <p>Best regards,<br>Carlos Shuttle Team</p>
    </div>
  `

  const smsMessage = `${promotion.title}: ${promotion.description}${promotion.discountPercent ? ` ${promotion.discountPercent}% off!` : ''} Use your membership number to redeem.`

  await Promise.all([
    ...memberEmails.map(email => sendEmail(email, emailSubject, emailHtml)),
    ...memberPhones.map(phone => sendSMS(phone, smsMessage)),
  ])
}

