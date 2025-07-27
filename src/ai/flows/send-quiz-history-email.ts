
'use server';

/**
 * @fileOverview A flow that sends the user their complete quiz history via email.
 * This flow formats the quiz history and simulates sending an email.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttemptSchema } from '@/ai/schemas';

const SendQuizHistoryEmailInputSchema = z.object({
  email: z.string().email().describe('The email address to send the history to.'),
  history: z.array(QuizAttemptSchema).describe('The full quiz history data.'),
});
export type SendQuizHistoryEmailInput = z.infer<typeof SendQuizHistoryEmailInputSchema>;

const SendQuizHistoryEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

function formatHistoryForEmail(history: z.infer<typeof SendQuizHistoryEmailInputSchema>['history']): string {
    let emailBody = "Here is your indcric quiz history:\n\n";

    history.forEach(attempt => {
        const date = new Date(attempt.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        emailBody += `----------------------------------------\n`;
        emailBody += `Quiz: ${attempt.format} (Brand: ${attempt.brand})\n`;
        emailBody += `Date: ${date}\n`;
        emailBody += `Score: ${attempt.score}/${attempt.totalQuestions}\n`;
        if (attempt.reason) {
            emailBody += `Status: Disqualified (Malpractice)\n`;
        }
        emailBody += `----------------------------------------\n\n`;
    });

    return emailBody;
}


// In a real application, you would replace this with an actual email sending service
// like Nodemailer, SendGrid, or Resend.
async function sendEmail(to: string, subject: string, body: string) {
    console.log("--- SIMULATING EMAIL ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("Body:\n", body);
    console.log("--- END SIMULATION ---");
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
}


export async function sendQuizHistoryEmail(input: SendQuizHistoryEmailInput): Promise<z.infer<typeof SendQuizHistoryEmailOutputSchema>> {
  return sendQuizHistoryEmailFlow(input);
}

const sendQuizHistoryEmailFlow = ai.defineFlow(
  {
    name: 'sendQuizHistoryEmailFlow',
    inputSchema: SendQuizHistoryEmailInputSchema,
    outputSchema: SendQuizHistoryEmailOutputSchema,
  },
  async ({ email, history }: SendQuizHistoryEmailInput) => {
    console.log(`Request to send quiz history to ${email}.`);
    
    const emailBody = formatHistoryForEmail(history);
    
    try {
        await sendEmail(email, "Your indcric Quiz History", emailBody);
        return {
          success: true,
          message: `An email with your complete quiz history has been sent to ${email}.`,
        };
    } catch (error) {
        console.error("Failed to send email:", error);
        return {
            success: false,
            message: "There was an error sending the email. Please try again later.",
        };
    }
  }
);
