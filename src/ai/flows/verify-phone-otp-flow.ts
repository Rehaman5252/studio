
'use server';

/**
 * @fileOverview A flow to verify a one-time password (OTP) for phone number verification.
 * 
 * - verifyPhoneOtp: Verifies the provided OTP against the expected value.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const VerifyPhoneOtpInputSchema = z.object({
  phone: z.string().describe('The 10-digit phone number being verified.'),
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }).describe('The 6-digit OTP entered by the user.'),
});
type VerifyPhoneOtpInput = z.infer<typeof VerifyPhoneOtpInputSchema>;

const VerifyPhoneOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
type VerifyPhoneOtpOutput = z.infer<typeof VerifyPhoneOtpOutputSchema>;

export async function verifyPhoneOtp(input: VerifyPhoneOtpInput): Promise<VerifyPhoneOtpOutput> {
  return verifyPhoneOtpFlow(input);
}

// NOTE: This is a mock implementation. In a real application, you would retrieve
// the stored OTP for the phone number from your database (e.g., Firestore) and
// compare it with the user's input.
const MOCK_OTP = '654321';

const verifyPhoneOtpFlow = ai.defineFlow(
  {
    name: 'verifyPhoneOtpFlow',
    inputSchema: VerifyPhoneOtpInputSchema,
    outputSchema: VerifyPhoneOtpOutputSchema,
  },
  async ({ phone, otp }) => {
    console.log(`[DEMO] Verifying OTP "${otp}" for phone ${phone}.`);

    if (otp === MOCK_OTP) {
        // In a real implementation, after successful verification, you would:
        // 1. Mark the phone number as verified in the user's document.
        // 2. Delete the used OTP from your database.
        return {
            success: true,
            message: 'Phone number verified successfully.',
        };
    } else {
        return {
            success: false,
            message: 'The OTP entered is incorrect. Please try again.',
        };
    }
  }
);
