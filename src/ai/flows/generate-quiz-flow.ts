'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  QuizQuestionSchema
} from '@/ai/schemas';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

// Mock function to provide a stable source of questions, replacing direct LLM calls for stability.
async function getCricketQuestions(format: string): Promise<z.infer<typeof QuizQuestionSchema>[]> {
  // In a real app, this could fetch from a Firestore collection or a dedicated microservice.
  const allQuestions: z.infer<typeof QuizQuestionSchema>[] = [
    {
      questionText: "Who was the Orange Cap winner in IPL 2023?",
      options: ["Faf du Plessis", "Shubman Gill", "Devdutt Padikkal", "Virat Kohli"],
      correctAnswer: "Shubman Gill",
      hint: "He played for Gujarat Titans.",
      explanation: "Shubman Gill scored 890+ runs in IPL 2023 and won the Orange Cap.",
    },
    {
      questionText: "Who took a hat-trick in the 2023 ODI World Cup semi-final?",
      options: ["Mohammed Siraj", "Rashid Khan", "Mohammed Shami", "Adam Zampa"],
      correctAnswer: "Mohammed Shami",
      hint: "He's India's leading wicket-taker in the tournament.",
      explanation: "Shami took a hat-trick vs New Zealand in the 2023 World Cup semi-final.",
    },
    {
      questionText: "Which team won the ICC Test Championship 2023?",
      options: ["India", "New Zealand", "Australia", "England"],
      correctAnswer: "Australia",
      hint: "They defeated India in the final.",
      explanation: "Australia beat India in the WTC final at The Oval in 2023.",
    },
    {
      questionText: "Who holds the record for fastest T20I century?",
      options: ["David Miller", "Suryakumar Yadav", "Kushal Malla", "Rohit Sharma"],
      correctAnswer: "Kushal Malla",
      hint: "He achieved this against Mongolia in Asian Games 2023.",
      explanation: "Kushal Malla scored a T20I century in 34 balls.",
    },
    {
      questionText: "Who won the Player of the Tournament in IPL 2023?",
      options: ["Ruturaj Gaikwad", "Mohammed Shami", "Shubman Gill", "Devon Conway"],
      correctAnswer: "Shubman Gill",
      hint: "He was also the top run-scorer.",
      explanation: "Gill dominated with runs and consistent performances.",
    },
    {
        questionText: "Which bowler has the most wickets in Test cricket history?",
        options: ["Shane Warne", "Anil Kumble", "James Anderson", "Muttiah Muralitharan"],
        correctAnswer: "Muttiah Muralitharan",
        hint: "This Sri Lankan spinner has 800 Test wickets.",
        explanation: "Muttiah Muralitharan of Sri Lanka holds the record with 800 Test wickets."
    },
    {
        questionText: "Who scored the first-ever double century in men's ODI cricket?",
        options: ["Virender Sehwag", "Chris Gayle", "Sachin Tendulkar", "Rohit Sharma"],
        correctAnswer: "Sachin Tendulkar",
        hint: "He achieved this milestone against South Africa in Gwalior.",
        explanation: "Sachin Tendulkar scored an unbeaten 200 against South Africa in 2010."
    },
    {
        questionText: "In which year was the first-ever day/night Test match played?",
        options: ["2012", "2015", "2017", "2018"],
        correctAnswer: "2015",
        hint: "It was played between Australia and New Zealand.",
        explanation: "The first day/night Test match was played between Australia and New Zealand in Adelaide in November 2015."
    }
  ];
  // Simple filtering for demonstration; a real app might filter by format tag.
  return allQuestions;
}

export async function generateQuiz(
  input: z.infer<typeof GenerateQuizInputSchema>
): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
  return generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ format, askedQuestions }) => {
    if (!db) {
        return {
            errorMessage: 'Database connection is not available. Please try again later.'
        };
    }
    
    try {
      const allQuestions = await getCricketQuestions(format);
      const filtered = allQuestions.filter(
        (q) => !(askedQuestions || []).includes(q.questionText)
      );
      
      // Simple shuffle and take 5
      const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);

      if (selected.length < 5) {
        return { errorMessage: 'Not enough unique questions available for this format.' };
      }
      
      // Write the newly selected questions to Firestore to prevent immediate re-use
      const batch = writeBatch(db);
      const questionsColl = collection(db, 'askedQuestions');
      selected.forEach(q => {
        const docRef = doc(questionsColl);
        batch.set(docRef, {
            questionText: q.questionText,
            format: format,
            createdAt: new Date(),
        });
      });
      await batch.commit();

      return { questions: selected };
    } catch (error) {
      console.error('❌ generateQuiz flow error:', error);
      return { errorMessage: 'Failed to generate quiz due to a server error.' };
    }
  }
);
