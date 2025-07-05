
'use server';

/**
 * @fileOverview A flow that generates a detailed analysis of a user's quiz performance.
 *
 * - generateQuizAnalysis - A function that provides feedback and improvement tips.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    GenerateQuizAnalysisInput,
    GenerateQuizAnalysisOutput,
    GenerateQuizAnalysisInputSchema,
    GenerateQuizAnalysisOutputSchema
} from '@/ai/schemas';

export async function generateQuizAnalysis(input: GenerateQuizAnalysisInput): Promise<GenerateQuizAnalysisOutput> {
  return generateQuizAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: z.string() },
  output: { format: 'string' },
  prompt: `You are an expert cricket coach. A user has just completed a quiz. Based on the following summary of their performance, generate a personalized performance report as a single, raw markdown-formatted string.

The analysis MUST be encouraging and cover these sections:
1.  **Overall Performance**: Start with a summary of their score.
2.  **Areas for Improvement**: Based on the incorrect answers, identify 1-2 specific topics for the user to study.
3.  **Actionable Tip**: Provide one specific, actionable tip for improvement.

Maintain a positive, coach-like tone. DO NOT wrap your response in JSON or any other special formatting.

Here is the user's quiz performance data:
{{{_input}}}
`,
  config: {
    // Set extremely permissive safety settings to prevent the model from blocking valid responses.
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateQuizAnalysisFlow = ai.defineFlow(
  {
    name: 'generateQuizAnalysisFlow',
    inputSchema: GenerateQuizAnalysisInputSchema,
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input) => {
    const score = input.questions.reduce((acc, q, index) => 
        (input.userAnswers[index] === q.correctAnswer) ? acc + 1 : acc, 0);
    
    const format = input.questions[0]?.questionText.includes('IPL') ? 'IPL' : (input.questions[0]?.questionText.includes('Test') ? 'Test' : 'General Cricket');

    const incorrect = input.questions.map((q, index) => ({
        ...q,
        userAnswer: input.userAnswers[index] || 'Not Answered',
        isCorrect: input.userAnswers[index] === q.correctAnswer,
        questionNumber: index + 1,
    })).filter(q => !q.isCorrect);

    let incorrectAnswersSummary = 'No incorrect answers! Great job!';
    if (incorrect.length > 0) {
        incorrectAnswersSummary = incorrect.map(q => 
            `Question ${q.questionNumber}: "${q.questionText}"\n  - Your Answer: ${q.userAnswer}\n  - Correct Answer: ${q.correctAnswer}`
        ).join('\n\n');
    }

    const promptInputString = `Format: ${format}\nScore: ${score}/${input.questions.length}\n\nIncorrect Answers:\n${incorrectAnswersSummary}`;
    
    try {
        const { output } = await analysisPrompt(promptInputString);
    
        if (!output || output.trim() === '') {
          // This case handles when the AI returns an empty string, but doesn't throw an error.
          // We will construct the fallback and return it.
          console.warn("AI analysis returned a null or empty analysis string. Providing a fallback response.", { output });
        } else {
            // If we got a valid output, return it.
            return { analysis: output };
        }

    } catch (error) {
        // This case handles when the analysisPrompt() call itself throws an error (e.g. network, auth, internal Genkit error)
        console.error("AI analysis call failed with an error. Providing a fallback response.", { error });
    }

    // This is the fallback logic. It's reached if the AI returns empty/null OR if the AI call throws an error.
    const fallbackAnalysis = `### Analysis Currently Unavailable

We couldn't generate a detailed AI analysis for this quiz at the moment. This can happen occasionally due to high traffic.

**Your Score:** ${score}/${input.questions.length}

You can try generating the analysis again from your Quiz History later.
`;
    return { analysis: fallbackAnalysis };
  }
);
