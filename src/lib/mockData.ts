
import type { QuizQuestion } from '@/ai/schemas';

export interface QuizAttempt {
  slotId: string;
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: string[];
  timestamp: number;
  timePerQuestion?: number[];
  usedHintIndices?: number[];
}

const mockQuestions: QuizQuestion[] = [
    {
        questionText: "Who is the highest run-scorer in the history of Test cricket?",
        options: ["Sachin Tendulkar", "Ricky Ponting", "Jacques Kallis", "Rahul Dravid"],
        correctAnswer: "Sachin Tendulkar",
        explanation: "Sachin Tendulkar of India is the highest run-scorer in Test history, with 15,921 runs.",
        hint: "This Indian batsman is often called the 'Little Master'."
    },
    {
        questionText: "Which country has won the most ODI World Cups?",
        options: ["India", "West Indies", "Australia", "England"],
        correctAnswer: "Australia",
        explanation: "Australia has won the ODI World Cup a record six times.",
        hint: "This country's team is known for its yellow and green colors."
    },
    {
        questionText: "In which year was the first Indian Premier League (IPL) held?",
        options: ["2007", "2008", "2009", "2010"],
        correctAnswer: "2008",
        explanation: "The first IPL season was played in 2008, with Rajasthan Royals emerging as the inaugural champions.",
        hint: "It was the year after India won the inaugural T20 World Cup."
    },
    {
        questionText: "What is the highest individual score in a single innings in Test matches?",
        options: ["375", "400*", "380", "501*"],
        correctAnswer: "400*",
        explanation: "Brian Lara of the West Indies holds the record with an unbeaten 400 against England in 2004.",
        hint: "A West Indian legend reclaimed his own record to set this score."
    },
    {
        questionText: "Who was the first bowler to take 800 Test wickets?",
        options: ["Shane Warne", "Anil Kumble", "Muttiah Muralitharan", "James Anderson"],
        correctAnswer: "Muttiah Muralitharan",
        explanation: "Sri Lanka's Muttiah Muralitharan was the first and, to date, only bowler to reach 800 wickets in Test cricket.",
        hint: "This Sri Lankan spinner is famous for his unique bowling action."
    }
];

export const mockQuizHistory: QuizAttempt[] = [
  {
    slotId: '1',
    brand: 'Nike',
    format: 'ODI',
    score: 4,
    totalQuestions: 5,
    questions: mockQuestions,
    userAnswers: ["Sachin Tendulkar", "Australia", "2008", "380", "Muttiah Muralitharan"],
    timestamp: new Date('2024-07-28T10:00:00Z').getTime(),
    timePerQuestion: [10, 5, 12, 19, 8],
    usedHintIndices: [4]
  },
  {
    slotId: '2',
    brand: 'boAt',
    format: 'IPL',
    score: 5,
    totalQuestions: 5,
    questions: mockQuestions,
    userAnswers: mockQuestions.map(q => q.correctAnswer),
    timestamp: new Date('2024-07-27T18:30:00Z').getTime(),
    timePerQuestion: [12, 14, 8, 11, 15],
    usedHintIndices: [0, 1]
  },
  {
    slotId: '3',
    brand: 'SBI',
    format: 'Test',
    score: 3,
    totalQuestions: 5,
    questions: mockQuestions,
    userAnswers: ["Ricky Ponting", "Australia", "2009", "400*", "Muttiah Muralitharan"],
    timestamp: new Date('2024-07-25T14:00:00Z').getTime(),
    timePerQuestion: [18, 6, 19, 10, 13],
    usedHintIndices: []
  },
  {
    slotId: '4',
    brand: 'Myntra',
    format: 'WPL',
    score: 2,
    totalQuestions: 5,
    questions: mockQuestions,
    userAnswers: ["Sachin Tendulkar", "West Indies", "2008", "375", "Shane Warne"],
    timestamp: new Date('2024-07-24T12:10:00Z').getTime(),
    timePerQuestion: [5, 20, 20, 15, 18],
    usedHintIndices: [1, 2, 3, 4]
  }
];
