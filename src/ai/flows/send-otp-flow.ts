'use server';
/**
 * @fileOverview A flow for sending a simulated One-Time Password (OTP) to an email address.
 *
 * - sendOtp - A function that simulates sending an OTP.
 */
import {z} from 'zod';

const SendOtpInputSchema = z.object({email: z.string().email()});
type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({success: z.boolean(), message: z.string()});
type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  console.log(`Sending OTP to ${input.email} (simulation)`);
  // In a real app, you would integrate with an email service like SendGrid or Nodemailer.
  // For this demo, we just simulate a success response.
  return {
    success: true,
    message: 'A verification code has been sent to your email. (Hint: 123456)',
  };
}
