
'use server';
/**
 * @fileOverview A flow to handle sending an OTP to a user's phone.
 *
 * - sendPhoneOtp - A dummy function that simulates sending an OTP.
 */

import { ai } from '@/ai/genkit';
import {
  SendPhoneOtpInputSchema,
  SendPhoneOtpOutputSchema,
  SendPhoneOtpInput,
  SendPhoneOtpOutput
} from '@/ai/schemas';

export async function sendPhoneOtp(input: SendPhoneOtpInput): Promise<SendPhoneOtpOutput> {
  return sendPhoneOtpFlow(input);
}

const sendPhoneOtpFlow = ai.defineFlow(
  {
    name: 'sendPhoneOtpFlow',
    inputSchema: SendPhoneOtpInputSchema,
    outputSchema: SendPhoneOtpOutputSchema,
  },
  async (input) => {
    console.log(`Simulating OTP sent to phone: ${input.phone}`);
    // In a real application, you would integrate an SMS service like Twilio here.
    return {
      success: true,
      message: 'A verification code has been sent to your phone number.',
    };
  }
);
