
'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateQuizInput,
  GenerateQuizOutput,
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema
} from '@/ai/schemas';
import { db } from '@/lib/firebase';
import {
  collection,
  writeBatch,
  doc,
} from 'firebase/firestore';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question, multiple-choice, text-only quiz about "{{format}}" cricket with a clear and strict difficulty progression.

The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The questions should cover a wide range of topics including: venue stats, team scores, player records (including strike rates, averages, etc.), match outcomes, milestones, historic moments, timelines, and format-specific records.

The 5 questions must follow this exact difficulty structure:

1.  **Question 1 (Easy):** A basic, widely-known fact (e.g., a famous player, a major tournament winner, a very common record).
2.  **Question 2 (Medium):** A question about a well-known event or stat that requires more specific knowledge (e.g., a specific series score, a notable partnership).
3.  **Question 3 (Hard):** A detailed question about a specific match, player statistic, or less common record.
4.  **Question 4 (Very Hard):** A question about an obscure match, a rare player achievement, or a specific but not widely-publicized statistic.
5.  **Question 5 (Extreme Hard):** A deep trivia question about historic rules, a technical aspect of a specific game, or a record from before the modern era.

**CRITICAL:** Do NOT repeat any of these previously asked questions:
{{#each askedQuestions}}
- "{{this}}"
{{/each}}
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
    ]
  }
});

const mixedFormatPrompt = ai.definePrompt({
  name: 'generateMixedQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question, multiple-choice, text-only quiz with increasing difficulty, where each question is from a different cricket format (IPL, WPL, T20, ODI, and Test).

The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The questions should cover a wide range of topics including: venue stats, team scores, player records (including strike rates, averages, etc.), match outcomes, milestones, historic moments, timelines, and format-specific records.

**CRITICAL:** Do NOT repeat any of these previously asked questions:
{{#each askedQuestions}}
- "{{this}}"
{{/each}}
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
    ]
  }
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema
  },
  async (input) => {
    if (!db) throw new Error("Firestore not initialized.");

    const prompt = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
        attempt++;
        console.log(`Attempt ${attempt} to generate a quiz for format: ${input.format}`);
        
        try {
            const { output } = await prompt({ format: input.format, askedQuestions: input.askedQuestions });

            if (output && output.questions.length === 5) {
                console.log(`Successfully generated a 5-question quiz on attempt ${attempt}.`);
                const batch = writeBatch(db);
                const questionsColl = collection(db, 'askedQuestions');

                for (const q of output.questions) {
                    const docRef = doc(questionsColl);
                    batch.set(docRef, {
                        questionText: q.questionText,
                        format: input.format,
                        createdAt: new Date()
                    });
                }

                await batch.commit().catch(err => {
                    console.error("Failed to write new questions to Firestore, but continuing:", err);
                });

                return output;
            }
            
            console.warn(`Attempt ${attempt} did not yield a 5-question quiz. Output was:`, output);
        } catch (error) {
            console.error(`An error occurred on attempt ${attempt}:`, error);
        }

        if (attempt < maxAttempts) {
            // Wait for a short duration before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // If all attempts fail, throw the final error.
    throw new Error(`AI failed to generate a 5-question quiz after ${maxAttempts} attempts.`);
  }
);
