'use server';
/**
 * @fileOverview A flow for verifying a simulated One-Time Password (OTP) from a phone number.
 *
 * - verifyPhoneOtp - A function that simulates verifying a phone OTP.
 */
import {z} from 'zod';

const VerifyPhoneOtpInputSchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  otp: z.string().length(6),
});
type VerifyPhoneOtpInput = z.infer<typeof VerifyPhoneOtpInputSchema>;

const VerifyPhoneOtpOutputSchema = z.object({success: z.boolean(), message: z.string()});
type VerifyPhoneOtpOutput = z.infer<typeof VerifyPhoneOtpOutputSchema>;

export async function verifyPhoneOtp(input: VerifyPhoneOtpInput): Promise<VerifyPhoneOtpOutput> {
  console.log(`Verifying OTP ${input.otp} for phone ${input.phone} (simulation)`);
  if (input.otp === '654321') {
    return {success: true, message: 'Phone number verified successfully.'};
  }
  return {success: false, message: 'Invalid OTP. Please try again.'};
}
