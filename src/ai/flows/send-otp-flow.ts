'use server';
/**
 * @fileOverview A flow to handle sending an OTP to a user's email.
 *
 * - sendOtp - A dummy function that simulates sending an OTP.
 */

import { ai } from '@/ai/genkit';
import {
  SendOtpInput,
  SendOtpOutput,
  SendOtpInputSchema,
  SendOtpOutputSchema,
} from '@/ai/schemas';

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async (input) => {
    console.log(`Simulating OTP sent to: ${input.email}`);
    // In a real application, you would integrate an email service here.
    // The OTP would be generated and stored temporarily for verification.
    return {
      success: true,
      message: 'A verification code has been sent to your email. Please check your inbox.',
    };
  }
);
