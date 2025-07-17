
'use server';

/**
 * @fileOverview A flow to send a one-time password (OTP) to a user's phone number for verification.
 * 
 * - sendPhoneOtp: Generates a real OTP, stores it in Firestore, and simulates sending it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseClient } from '@/lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

const SendPhoneOtpInputSchema = z.object({
  phone: z.string().describe('The 10-digit phone number to send the OTP to.'),
});
type SendPhoneOtpInput = z.infer<typeof SendPhoneOtpInputSchema>;

const SendPhoneOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  otp: z.string().optional(),
});
type SendPhoneOtpOutput = z.infer<typeof SendPhoneOtpOutputSchema>;

export async function sendPhoneOtp(input: SendPhoneOtpInput): Promise<SendPhoneOtpOutput> {
  return sendPhoneOtpFlow(input);
}

const sendPhoneOtpFlow = ai.defineFlow(
  {
    name: 'sendPhoneOtpFlow',
    inputSchema: SendPhoneOtpInputSchema,
    outputSchema: SendPhoneOtpOutputSchema,
  },
  async ({ phone }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      const { db } = await getFirebaseClient();
      const otpRequestRef = doc(db, 'otpRequests', phone);
      await setDoc(otpRequestRef, {
        phone,
        otp,
        expires,
        verified: false,
      });

      console.log(`[REAL-OTP] Stored OTP ${otp} for ${phone}. Expires at ${expires.toLocaleTimeString()}`);

      return {
        success: true,
        message: 'A verification code has been generated.',
        otp: otp, // This is for demo only.
      };
    } catch (error) {
      console.error("Error storing OTP in Firestore:", error);
      return {
        success: false,
        message: 'Could not process OTP request. Please try again.',
      };
    }
  }
);
