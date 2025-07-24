
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
  query,
  where,
  getDocs
} from 'firebase/firestore';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question, multiple-choice, text-only quiz about "{{format}}" cricket with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact structure:

1.  **Question 1 (Easy):** A basic fact (famous player, tournament, venue).
2.  **Question 2 (Medium):** A common record, series stat, or known moment.
3.  **Question 3 (Hard):** Detailed match info or player stat.
4.  **Question 4 (Very Hard):** Rare match or obscure achievement.
5.  **Question 5 (Extreme Hard):** Historic trivia or technical scenario.

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
  prompt: `Generate a 5-question, multiple-choice, text-only quiz with increasing difficulty, where each question is from a different cricket format (IPL, WPL, T20, ODI, and Test). The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

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
    const { output } = await prompt({ format: input.format, askedQuestions: input.askedQuestions });

    if (!output || output.questions.length !== 5) {
      throw new Error("AI failed to generate a 5-question quiz.");
    }

    const batch = writeBatch(db);
    const questionsColl = collection(db, 'askedQuestions');

    for (const q of output.questions) {
      // Use a new doc ref for each question to ensure they are added as new documents
      const docRef = doc(questionsColl); 
      batch.set(docRef, {
        questionText: q.questionText,
        format: input.format, // Log the format for potential analysis
        createdAt: new Date() // Use server timestamp for accuracy
      });
    }

    try {
        await batch.commit();
    } catch (err) {
        // Log the error but don't fail the whole quiz generation,
        // as the questions are still usable.
        console.error("❌ Failed to write new questions to Firestore:", err);
    }

    return output;
  }
);

    