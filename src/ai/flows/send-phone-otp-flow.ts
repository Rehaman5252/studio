
'use server';

/**
 * @fileOverview A flow to send a one-time password (OTP) to a user's phone number for verification.
 * 
 * - sendPhoneOtp: Sends an OTP to the given phone number.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SendPhoneOtpInputSchema = z.object({
  phone: z.string().describe('The 10-digit phone number to send the OTP to.'),
});
type SendPhoneOtpInput = z.infer<typeof SendPhoneOtpInputSchema>;

const SendPhoneOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
type SendPhoneOtpOutput = z.infer<typeof SendPhoneOtpOutputSchema>;


export async function sendPhoneOtp(input: SendPhoneOtpInput): Promise<SendPhoneOtpOutput> {
  return sendPhoneOtpFlow(input);
}


// NOTE: This is a mock implementation. In a real application, you would integrate
// with an SMS service like Twilio to send a real OTP. For this demo, we simulate
// the success and use a fixed OTP (see verify-phone-otp-flow.ts).
const sendPhoneOtpFlow = ai.defineFlow(
  {
    name: 'sendPhoneOtpFlow',
    inputSchema: SendPhoneOtpInputSchema,
    outputSchema: SendPhoneOtpOutputSchema,
  },
  async ({ phone }) => {
    console.log(`[DEMO] Simulating OTP sent to ${phone}.`);
    
    // In a real implementation, you would:
    // 1. Generate a random 6-digit OTP.
    // 2. Store the OTP with an expiration time, associated with the phone number (e.g., in Firestore).
    // 3. Use an SMS service client to send the OTP.
    // 4. Handle any errors from the SMS service.

    return {
      success: true,
      message: 'A verification code has been sent to your phone number.',
    };
  }
);
