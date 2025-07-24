'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateQuizInput,
  GenerateQuizOutput,
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema
} from '@/ai/schemas';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization error:', e);
  }
}

const db = getFirestore();

const GenerateQuizPromptInputSchema = z.object({
  format: z.string(),
  askedQuestions: z.array(z.string())
});

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizPromptInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question, multiple-choice, text-only quiz about "{{format}}" cricket with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact structure:

1.  **Question 1 (Easy):** A basic fact (famous player, tournament, venue).
2.  **Question 2 (Medium):** A common record, series stat, or known moment.
3.  **Question 3 (Hard):** Detailed match info or player stat.
4.  **Question 4 (Very Hard):** Rare match or obscure achievement.
5.  **Question 5 (Extreme Hard):** Historic trivia or technical scenario.

**CRITICAL:** Do NOT repeat these asked questions:
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
  input: { schema: GenerateQuizPromptInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `Generate a 5-question quiz from IPL, WPL, T20, ODI, and Test formats with increasing difficulty. Each question must use a different format and not repeat asked questions.

Use only real cricket facts. Do not mention brands or sponsors.`,
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
    // 1. Fetch existing questions using Admin SDK
    const questionsRef = db.collection('askedQuestions');
    const questionsQuery = questionsRef.where('format', '==', input.format);
    const snapshot = await questionsQuery.get();
    const askedQuestions = snapshot.docs.map((doc) => doc.data().questionText as string);

    // 2. Generate new quiz
    const prompt = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    const { output } = await prompt({ format: input.format, askedQuestions });

    if (!output || output.questions.length !== 5) {
      throw new Error("AI failed to generate a 5-question quiz.");
    }

    // 3. Save new questions using Admin SDK
    const batch = db.batch();
    const questionsColl = db.collection('askedQuestions');

    for (const q of output.questions) {
      const docRef = questionsColl.doc();
      batch.set(docRef, {
        questionText: q.questionText,
        format: input.format,
        createdAt: new Date()
      });
    }

    await batch.commit();

    return output;
  }
);
