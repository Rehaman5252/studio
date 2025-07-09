'use server';
/**
 * @fileOverview A flow for sending a simulated One-Time Password (OTP) to a phone number.
 *
 * - sendPhoneOtp - A function that simulates sending an OTP via SMS.
 */
import {z} from 'zod';

const SendPhoneOtpInputSchema = z.object({phone: z.string().regex(/^\d{10}$/)});
type SendPhoneOtpInput = z.infer<typeof SendPhoneOtpInputSchema>;

const SendPhoneOtpOutputSchema = z.object({success: z.boolean(), message: z.string()});
type SendPhoneOtpOutput = z.infer<typeof SendPhoneOtpOutputSchema>;

export async function sendPhoneOtp(input: SendPhoneOtpInput): Promise<SendPhoneOtpOutput> {
  console.log(`Sending OTP to phone ${input.phone} (simulation)`);
  // In a real app, you would integrate with an SMS gateway like Twilio.
  // For this demo, we simulate success.
  return {
    success: true,
    message: 'A verification code has been sent to your phone. (Hint: 654321)',
  };
}
