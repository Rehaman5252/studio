'use server';
/**
 * @fileOverview A flow for verifying a simulated One-Time Password (OTP) from an email.
 *
 * - verifyOtp - A function that simulates verifying an OTP.
 */
import {z} from 'zod';

const VerifyOtpInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});
type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

const VerifyOtpOutputSchema = z.object({success: z.boolean(), message: z.string()});
type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
  console.log(`Verifying OTP ${input.otp} for ${input.email} (simulation)`);
  if (input.otp === '123456') {
    return {success: true, message: 'Email verified successfully.'};
  }
  return {success: false, message: 'Invalid OTP. Please try again.'};
}
