'use server';
/**
 * @fileOverview A flow to verify an OTP submitted by a user.
 *
 * - verifyOtp - A dummy function that simulates verifying an OTP.
 */

import { ai } from '@/ai/genkit';
import {
  VerifyOtpInput,
  VerifyOtpOutput,
  VerifyOtpInputSchema,
  VerifyOtpOutputSchema,
} from '@/ai/schemas';

export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
  return verifyOtpFlow(input);
}

const verifyOtpFlow = ai.defineFlow(
  {
    name: 'verifyOtpFlow',
    inputSchema: VerifyOtpInputSchema,
    outputSchema: VerifyOtpOutputSchema,
  },
  async (input) => {
    console.log(`Verifying OTP for ${input.email} with code ${input.otp}`);
    // In a real application, this would check against a stored OTP.
    // For this demo, we'll use a hardcoded value.
    const DUMMY_OTP = '123456';

    if (input.otp === DUMMY_OTP) {
      return {
        success: true,
        message: 'Email verified successfully.',
      };
    } else {
      return {
        success: false,
        message: 'The verification code is incorrect. Please try again.',
      };
    }
  }
);
