
'use server';

/**
 * @fileOverview A flow to verify a one-time password (OTP) for phone number verification.
 * 
 * - verifyPhoneOtp: Verifies the provided OTP against the value stored in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseClient } from '@/lib/firebaseClient';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

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


const verifyPhoneOtpFlow = ai.defineFlow(
  {
    name: 'verifyPhoneOtpFlow',
    inputSchema: VerifyPhoneOtpInputSchema,
    outputSchema: VerifyPhoneOtpOutputSchema,
  },
  async ({ phone, otp }) => {
    try {
      const { db } = await getFirebaseClient();
      const otpRequestRef = doc(db, 'otpRequests', phone);
      const docSnap = await getDoc(otpRequestRef);

      if (!docSnap.exists()) {
        return { success: false, message: 'No OTP request found for this number. Please request a new code.' };
      }

      const otpData = docSnap.data();
      
      // Check if OTP has expired
      if (otpData.expires.toDate() < new Date()) {
        await deleteDoc(otpRequestRef); // Clean up expired OTP
        return { success: false, message: 'The OTP has expired. Please request a new one.' };
      }

      // Check if the OTP matches
      if (otpData.otp !== otp) {
        return { success: false, message: 'The OTP entered is incorrect. Please try again.' };
      }

      // Successful verification
      // Delete the OTP document so it cannot be reused.
      await deleteDoc(otpRequestRef); 
      
      console.log(`[REAL-OTP] Successfully verified OTP for ${phone}.`);
      
      return { success: true, message: 'Phone number verified successfully.' };

    } catch (error) {
      console.error("Error verifying OTP from Firestore:", error);
      return { success: false, message: 'An error occurred during verification.' };
    }
  }
);
