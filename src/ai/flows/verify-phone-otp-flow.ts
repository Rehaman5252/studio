
'use server';
/**
 * @fileOverview A flow to verify a phone OTP submitted by a user.
 *
 * - verifyPhoneOtp - A dummy function that simulates verifying a phone OTP.
 */

import { ai } from '@/ai/genkit';
import {
    VerifyPhoneOtpInputSchema,
    VerifyPhoneOtpOutputSchema,
    VerifyPhoneOtpInput,
    VerifyPhoneOtpOutput
} from '@/ai/schemas';

export async function verifyPhoneOtp(input: VerifyPhoneOtpInput): Promise<VerifyPhoneOtpOutput> {
  return verifyPhoneOtpFlow(input);
}

const verifyPhoneOtpFlow = ai.defineFlow(
  {
    name: 'verifyPhoneOtpFlow',
    inputSchema: VerifyPhoneOtpInputSchema,
    outputSchema: VerifyPhoneOtpOutputSchema,
  },
  async (input) => {
    console.log(`Verifying OTP for phone ${input.phone} with code ${input.otp}`);
    // For this demo, we'll use a hardcoded value.
    const DUMMY_OTP = '654321';

    if (input.otp === DUMMY_OTP) {
      return {
        success: true,
        message: 'Phone number verified successfully.',
      };
    } else {
      return {
        success: false,
        message: 'The verification code is incorrect. Please try again.',
      };
    }
  }
);
