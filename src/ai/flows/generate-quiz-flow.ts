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
  try {
    return await generateQuizFlow(input);
  } catch (err) {
    console.error('❌ generateQuizFlow threw an unexpected error:', err);
    return {
      questions: [],
      errorMessage: 'A system error occurred while generating the quiz. Please try again later.'
    };
  }
}

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question, multiple-choice, text-only quiz about "{{format}}" cricket with a clear and strict difficulty progression.

The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The questions should cover a wide range of topics including: venue stats, team scores, player records (including strike rates, averages, etc.), match outcomes, milestones, historic moments, timelines, and format-specific records.

The 5 questions must follow this exact difficulty structure:

1.  **Question 1 (Easy):** A basic, widely-known fact.
2.  **Question 2 (Medium):** A stat that requires more specific knowledge.
3.  **Question 3 (Hard):** A detailed question about a specific match/player.
4.  **Question 4 (Very Hard):** A rare achievement or obscure match stat.
5.  **Question 5 (Extreme Hard):** A deep trivia question from cricket history.

**CRITICAL:** Do NOT repeat any of these previously asked questions:
{{#each askedQuestions}}
- "{{this}}"
{{/each}}`,
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
{{/each}}`,
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
    if (!db) {
      return {
        questions: [],
        errorMessage: 'Firestore is not initialized. Please contact support.'
      };
    }

    const prompt = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🧠 Attempt ${attempt}: Generating quiz for format "${input.format}"`);

      try {
        const { output } = await prompt({
          format: input.format,
          askedQuestions: input.askedQuestions
        });

        if (output?.questions?.length === 5) {
          console.log(`✅ Success: Quiz generated on attempt ${attempt}`);

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
            console.warn('⚠️ Firestore write failed (non-blocking):', err);
          });

          return output;
        }

        console.warn(`⚠️ Incomplete quiz on attempt ${attempt}:`, output);
      } catch (err) {
        console.error(`❌ Error during attempt ${attempt}:`, err);
      }

      await new Promise(res => setTimeout(res, 400)); // brief delay before retry
    }

    return {
      questions: [],
      errorMessage: 'AI could not generate a quiz after 3 attempts. Please try again later.'
    };
  }
);
