
'use server';

/**
 * @fileOverview This flow is deprecated and will be removed.
 * Phone verification is now handled by the standard Firebase Phone Auth system.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DeprecatedSchema = z.object({
    message: z.string(),
});

export async function verifyPhoneOtp(input: any): Promise<any> {
  return verifyPhoneOtpFlow(input);
}


const verifyPhoneOtpFlow = ai.defineFlow(
  {
    name: 'verifyPhoneOtpFlow_DEPRECATED',
    inputSchema: z.any(),
    outputSchema: DeprecatedSchema,
  },
  async () => {
    const message = "This OTP flow is deprecated. Please use the Firebase Phone Auth client-side implementation.";
    console.warn(message);
    return { success: false, message };
  }
);
