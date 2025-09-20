
import type { QuizQuestion } from '@/ai/schemas';

/**
 * @fileOverview Fallback quiz data source.
 * This file contains a curated list of high-quality questions used as a fallback
 * when the primary AI generation system fails or when Firestore is unavailable.
 */

// Helper to shuffle an array, used for local fallback.
export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export type FallbackQuestion = Omit<QuizQuestion, 'id'> & {
  id: string; // id is now mandatory here
  format: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Expert';
};


// A larger set of questions for better fallback variety.
export const allFallbackQuestions: FallbackQuestion[] = [
    // =================================================================================
    // MIXED (10 Questions)
    // =================================================================================
    { id: 'fb_mix_1', format: 'mixed', difficulty: 'Easy', question: 'How many players are there on a standard cricket team?', options: ['9', '10', '11', '12'], correctAnswer: '11', explanation: 'A standard cricket team consists of eleven players on the field.' },
    { id: 'fb_mix_2', format: 'mixed', difficulty: 'Easy', question: 'What is a "maiden over"?', options: ['An over with 1 wicket', 'An over with 6 wides', 'An over with no runs scored', 'An over bowled by a female cricketer'], correctAnswer: 'An over with no runs scored', explanation: 'A maiden over is an over in which the bowler does not concede any runs scored off the bat.' },
    { id: 'fb_mix_3', format: 'mixed', difficulty: 'Easy', question: 'What does "LBW" stand for?', options: ['Leg Before Wicket', 'Leg Behind Wicket', 'Long Ball Wide', 'Leg Bye Wicket'], correctAnswer: 'Leg Before Wicket', explanation: 'LBW is a common way for a batsman to be dismissed if the ball strikes their body before the bat.' },
    { id: 'fb_mix_4', format: 'mixed', difficulty: 'Medium', question: 'Who was the first batsman to score 10,000 runs in Test cricket?', options: ['Don Bradman', 'Sunil Gavaskar', 'Viv Richards', 'Allan Border'], correctAnswer: 'Sunil Gavaskar', explanation: 'India\'s Sunil Gavaskar was the first cricketer to reach the milestone of 10,000 runs in Test matches.' },
    { id: 'fb_mix_5', format: 'mixed', difficulty: 'Medium', question: 'The "Ball of the Century" was bowled by Shane Warne to which batsman?', options: ['Sachin Tendulkar', 'Mike Gatting', 'Brian Lara', 'Graham Gooch'], correctAnswer: 'Mike Gatting', explanation: 'Shane Warne\'s first delivery in Ashes cricket in 1993 drifted and spun extravagantly to bowl England\'s Mike Gatting.' },
    { id: 'fb_mix_6', format: 'mixed', difficulty: 'Hard', question: 'Who is the only player to score 400 runs in a single Test innings?', options: ['Don Bradman', 'Virender Sehwag', 'Chris Gayle', 'Brian Lara'], correctAnswer: 'Brian Lara', explanation: 'Brian Lara of the West Indies scored an unbeaten 400 against England in 2004, the only quadruple century in Test history.' },
    { id: 'fb_mix_7', format: 'mixed', difficulty: 'Hard', question: 'The first official international cricket match was held in 1844 between which two nations?', options: ['England and Australia', 'USA and Canada', 'India and England', 'South Africa and Australia'], correctAnswer: 'USA and Canada', explanation: 'The first-ever officially recognized international cricket match took place between the United States and Canada in New York in 1844.' },
    { id: 'fb_mix_8', format: 'mixed', difficulty: 'Very Hard', question: 'Who is the only cricketer to have been knighted for services to cricket while still an active Test player?', options: ['Don Bradman', 'Jack Hobbs', 'Garfield Sobers', 'Ian Botham'], correctAnswer: 'Don Bradman', explanation: 'Sir Donald Bradman was knighted in March 1949, while he was still an active player, though he had just played his final Test in 1948.' },
    { id: 'fb_mix_9', format: 'mixed', difficulty: 'Expert', question: 'Which ground hosted the first-ever day-night Test match?', options: ['Lord\'s, London', 'MCG, Melbourne', 'Adelaide Oval, Adelaide', 'Eden Gardens, Kolkata'], correctAnswer: 'Adelaide Oval, Adelaide', explanation: 'The first day-night Test match was played between Australia and New Zealand at the Adelaide Oval in November 2015.' },
    { id: 'fb_mix_10', format: 'mixed', difficulty: 'Easy', question: 'Which team is known as the "Baggy Greens"?', options: ['South Africa', 'New Zealand', 'Australia', 'England'], correctAnswer: 'Australia', explanation: 'The Australian Test cricket team is famously known as the Baggy Greens, after their iconic cap.' },
    
    // =================================================================================
    // IPL (5 Questions)
    // =================================================================================
    { id: 'fb_ipl_1', format: 'ipl', difficulty: 'Easy', question: 'Which team won the inaugural IPL tournament in 2008?', options: ['Chennai Super Kings', 'Mumbai Indians', 'Rajasthan Royals', 'Kolkata Knight Riders'], correctAnswer: 'Rajasthan Royals', explanation: 'Under the captaincy of Shane Warne, the underdog Rajasthan Royals won the first-ever IPL season.'},
    { id: 'fb_ipl_2', format: 'ipl', difficulty: 'Medium', question: 'Who holds the record for the highest individual score in an IPL match?', options: ['Brendon McCullum', 'AB de Villiers', 'Chris Gayle', 'KL Rahul'], correctAnswer: 'Chris Gayle', explanation: 'Chris Gayle scored an incredible 175* off just 66 balls for Royal Challengers Bangalore against Pune Warriors in 2013.'},
    { id: 'fb_ipl_3', format: 'ipl', difficulty: 'Hard', question: 'Who was the first player to take a hat-trick in the IPL?', options: ['Lakshmipathy Balaji', 'Amit Mishra', 'Makhaya Ntini', 'Pravin Tambe'], correctAnswer: 'Lakshmipathy Balaji', explanation: 'Lakshmipathy Balaji, playing for Chennai Super Kings, took the first-ever hat-trick in the IPL against Kings XI Punjab in 2008.'},
    { id: 'fb_ipl_4', format: 'ipl', difficulty: 'Very Hard', question: 'Which player has the most "Player of the Match" awards in IPL history?', options: ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma', 'AB de Villiers'], correctAnswer: 'AB de Villiers', explanation: 'AB de Villiers holds the record for the most Player of the Match awards in the IPL, showcasing his consistent impact.'},
    { id: 'fb_ipl_5', format: 'ipl', difficulty: 'Expert', question: 'Paul Valthaty scored a memorable century in IPL 2011 for which team?', options: ['Kings XI Punjab', 'Pune Warriors', 'Deccan Chargers', 'Kochi Tuskers Kerala'], correctAnswer: 'Kings XI Punjab', explanation: 'Paul Valthaty played a blistering knock of 120* for Kings XI Punjab against Chennai Super Kings in 2011, one of the breakout performances of that season.'},

    // =================================================================================
    // T20 (5 Questions)
    // =================================================================================
    { id: 'fb_t20_1', format: 't20', difficulty: 'Easy', question: 'Who hit six sixes in an over in the 2007 ICC World T20?', options: ['Chris Gayle', 'Yuvraj Singh', 'MS Dhoni', 'Shahid Afridi'], correctAnswer: 'Yuvraj Singh', explanation: 'Yuvraj Singh famously hit England\'s Stuart Broad for six sixes in an over during the inaugural ICC World T20 in 2007.'},
    { id: 'fb_t20_2', format: 't20', difficulty: 'Medium', question: 'Which team has won the most ICC Men\'s T20 World Cup titles?', options: ['India', 'West Indies', 'Australia', 'England'], correctAnswer: 'West Indies', explanation: 'The West Indies are the only team to have won the ICC Men\'s T20 World Cup twice, in 2012 and 2016.'},
    { id: 'fb_t20_3', format: 't20', difficulty: 'Hard', question: 'Who holds the record for the fastest century in T20 international history?', options: ['Rohit Sharma', 'David Miller', 'Chris Gayle', 'Kushal Malla'], correctAnswer: 'Kushal Malla', explanation: 'Nepal\'s Kushal Malla broke the record for the fastest T20I century, reaching the milestone in just 34 balls against Mongolia in 2023.'},
    { id: 'fb_t20_4', format: 't20', difficulty: 'Very Hard', question: 'What is the "Super Over"?', options: ['A 12-ball over', 'A tie-breaking method', 'An over with special fielding restrictions', 'An over where runs count double'], correctAnswer: 'A tie-breaking method', explanation: 'A Super Over, or one-over eliminator, is used to decide the winner of a tied T20 match.'},
    { id: 'fb_t20_5', format: 't20', difficulty: 'Expert', question: 'The first-ever Men\'s T20 International was played between which two countries in 2005?', options: ['England and Australia', 'Australia and New Zealand', 'South Africa and West Indies', 'India and Pakistan'], correctAnswer: 'Australia and New Zealand', explanation: 'The first men\'s T20I took place on 17 February 2005 between Australia and New Zealand, with players famously wearing retro kits and wigs.'}
];

/**
 * Retrieves a fallback quiz from the local array.
 * @param format The cricket format (e.g., 'ipl', 't20').
 * @returns A QuizData object containing 5 questions.
 */
export function getLocalFallbackQuiz(format: string): { questions: QuizQuestion[] } {
  const normalizedFormat = format.toLowerCase();
  
  let questionsForFormat = allFallbackQuestions.filter(
    (q) => q.format === normalizedFormat
  );

  // If no questions for the specific format, use 'mixed'
  if (questionsForFormat.length < 5) {
    questionsForFormat = allFallbackQuestions.filter((q) => q.format === 'mixed');
  }

  return { questions: shuffleArray(questionsForFormat).slice(0, 5) };
}
