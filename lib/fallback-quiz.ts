
import type { QuizData } from '@/ai/schemas';

/**
 * @fileOverview Fallback quiz data.
 * This file provides a static set of quizzes to be used if the AI generation fails.
 * This ensures the application remains functional even if the Genkit flow encounters an error.
 * Note: All keys should be lowercase to match the normalized format from the API route.
 */

export const fallbackQuizData: { [key: string]: QuizData } = {
  mixed: {
    questions: [
      { id: 'fb_mix_1', question: 'Who is known as the "God of Cricket"?', options: ['Viv Richards', 'Sachin Tendulkar', 'Don Bradman', 'Brian Lara'], correctAnswer: 'Sachin Tendulkar', explanation: 'Sachin Tendulkar is widely regarded as one of the greatest batsmen in the history of cricket and is affectionately known as the "God of Cricket" by his fans.' },
      { id: 'fb_mix_2', question: 'What is the maximum number of overs in a T20 match for one team?', options: ['10', '20', '50', '90'], correctAnswer: '20', explanation: 'In a Twenty20 (T20) match, each team gets to bat for a maximum of 20 overs.' },
      { id: 'fb_mix_3', question: 'Which country won the first-ever Cricket World Cup in 1975?', options: ['Australia', 'England', 'India', 'West Indies'], correctAnswer: 'West Indies', explanation: 'The West Indies, led by Clive Lloyd, won the inaugural Cricket World Cup in 1975, defeating Australia in the final.' },
      { id: 'fb_mix_4', question: 'How many days is a standard Test match scheduled for?', options: ['1', '3', '5', '7'], correctAnswer: '5', explanation: 'A standard Test match is played over five days, with each day having a set number of overs.' },
      { id: 'fb_mix_5', question: 'What does "LBW" stand for in cricket?', options: ['Leg Beyond Wicket', 'Leg Before Wicket', 'Long Boundary Wide', 'Leg Bowled Wicket'], correctAnswer: 'Leg Before Wicket', explanation: 'LBW is a common mode of dismissal in cricket where the batsman is out if the ball hits their leg before hitting the bat or wicket.' },
    ],
  },
  ipl: {
    questions: [
      { id: 'fb_ipl_1', question: 'Which team has won the most IPL titles?', options: ['Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bangalore'], correctAnswer: 'Mumbai Indians', explanation: 'As of recent tournaments, Mumbai Indians hold the record for the most IPL championship titles.' },
      { id: 'fb_ipl_2', question: 'Who is the all-time leading run-scorer in the IPL?', options: ['Suresh Raina', 'Rohit Sharma', 'David Warner', 'Virat Kohli'], correctAnswer: 'Virat Kohli', explanation: 'Virat Kohli holds the record for the most runs scored in the history of the Indian Premier League.' },
      { id: 'fb_ipl_3', question: 'Which player holds the record for the highest individual score in an IPL match?', options: ['Chris Gayle', 'Brendon McCullum', 'AB de Villiers', 'KL Rahul'], correctAnswer: 'Chris Gayle', explanation: 'Chris Gayle scored an unbeaten 175 runs off just 66 balls for Royal Challengers Bangalore against Pune Warriors India in 2013.' },
      { id: 'fb_ipl_4', question: 'What is the "Orange Cap" awarded for in the IPL?', options: ['Most wickets', 'Most runs', 'Most sixes', 'Best fair play'], correctAnswer: 'Most runs', explanation: 'The Orange Cap is awarded to the leading run-scorer in an edition of the Indian Premier League.' },
      { id: 'fb_ipl_5', question: 'Who was the first player to take a hat-trick in the IPL?', options: ['Amit Mishra', 'Yuvraj Singh', 'Lakshmipathy Balaji', 'Makhaya Ntini'], correctAnswer: 'Lakshmipathy Balaji', explanation: 'Lakshmipathy Balaji, playing for Chennai Super Kings, took the first-ever hat-trick in the IPL against Kings XI Punjab in 2008.' },
    ],
  },
  t20: {
    questions: [
      { id: 'fb_t20_1', question: 'Who hit six sixes in an over in the inaugural ICC World T20 in 2007?', options: ['Chris Gayle', 'Yuvraj Singh', 'MS Dhoni', 'Shahid Afridi'], correctAnswer: 'Yuvraj Singh', explanation: 'Yuvraj Singh famously hit six sixes in an over off England\'s Stuart Broad during the 2007 ICC World T20.' },
      { id: 'fb_t20_2', question: 'Which country has won the most ICC T20 World Cup titles?', options: ['India', 'Australia', 'England', 'West Indies'], correctAnswer: 'West Indies', explanation: 'The West Indies are the only team to have won the ICC T20 World Cup twice (as of recent tournaments).' },
      { id: 'fb_t20_3', question: 'What is a "Super Over" in T20 cricket?', options: ['An over with 8 balls', 'An over where runs are doubled', 'A tie-breaking method', 'The first over of the match'], correctAnswer: 'A tie-breaking method', explanation: 'A Super Over is a one-over-per-side eliminator used to decide the winner of a tied T20 match.' },
      { id: 'fb_t20_4', question: 'Who is the highest wicket-taker in T20 International history?', options: ['Lasith Malinga', 'Shahid Afridi', 'Shakib Al Hasan', 'Tim Southee'], correctAnswer: 'Tim Southee', explanation: 'New Zealand\'s Tim Southee recently surpassed Shakib Al Hasan to become the leading wicket-taker in T20 Internationals.' },
      { id: 'fb_t20_5', question: 'What are the field restrictions in the first 6 overs of a T20 innings called?', options: ['Power Surge', 'Free Hit', 'Powerplay', 'Strategic Timeout'], correctAnswer: 'Powerplay', explanation: 'The first six overs of a T20 innings are the mandatory Powerplay, where only a maximum of two fielders are allowed outside the 30-yard circle.' },
    ],
  },
  odi: {
    questions: [
        { id: 'fb_odi_1', question: 'Who holds the record for the highest individual score in a One Day International (ODI) match?', options: ['Martin Guptill', 'Virender Sehwag', 'Rohit Sharma', 'Chris Gayle'], correctAnswer: 'Rohit Sharma', explanation: 'Rohit Sharma scored a record 264 runs for India against Sri Lanka in 2014, the highest individual score in ODI history.' },
        { id: 'fb_odi_2', question: 'Which team has won the most ICC Cricket World Cups?', options: ['India', 'West Indies', 'England', 'Australia'], correctAnswer: 'Australia', explanation: 'Australia is the most successful team in World Cup history, having won the tournament a record number of times.' },
        { id: 'fb_odi_3', question: 'How many overs are there in a standard ODI innings?', options: ['20', '40', '50', '60'], correctAnswer: '50', explanation: 'A standard One Day International match consists of 50 overs per side.' },
        { id: 'fb_odi_4', question: 'Who was the first cricketer to score a double century in a men\'s ODI?', options: ['Viv Richards', 'Saeed Anwar', 'Sachin Tendulkar', 'Charles Coventry'], correctAnswer: 'Sachin Tendulkar', explanation: 'Sachin Tendulkar became the first man to score a double century in ODIs, with 200* against South Africa in 2010.' },
        { id: 'fb_odi_5', question: 'What do the two white circles on an ODI field represent?', options: ['Bowling machine placement', 'The 30-yard circle for fielding restrictions', 'Water break stations', 'Protected area for the pitch'], correctAnswer: 'The 30-yard circle for fielding restrictions', explanation: 'The two semi-circles on an ODI field connect to form a 30-yard circle, which is key for enforcing fielding restrictions during different phases of the innings.' },
    ],
  },
  test: {
      questions: [
          { id: 'fb_test_1', question: 'Who has scored the most runs in the history of Test cricket?', options: ['Ricky Ponting', 'Jacques Kallis', 'Sachin Tendulkar', 'Rahul Dravid'], correctAnswer: 'Sachin Tendulkar', explanation: 'Sachin Tendulkar from India holds the record for the most runs scored in Test cricket history, with over 15,000 runs.' },
          { id: 'fb_test_2', question: 'Who has taken the most wickets in Test cricket history?', options: ['Shane Warne', 'Anil Kumble', 'James Anderson', 'Muttiah Muralitharan'], correctAnswer: 'Muttiah Muralitharan', explanation: 'Sri Lankan spinner Muttiah Muralitharan holds the record for the most wickets in Test cricket, with an incredible 800 wickets.' },
          { id: 'fb_test_3', question: 'What is the highest possible individual score in a single innings of a Test match?', options: ['300*', '400*', '501*', 'There is no limit'], correctAnswer: 'There is no limit', explanation: 'Unlike limited-overs cricket, there is no theoretical limit to how many runs a batsman can score in a Test innings, as long as their team does not declare or get bowled out.' },
          { id: 'fb_test_4', question: 'The Ashes is a Test cricket series played between which two countries?', options: ['India and Pakistan', 'Australia and England', 'South Africa and New Zealand', 'West Indies and Sri Lanka'], correctAnswer: 'Australia and England', explanation: 'The Ashes is one of the oldest and most famous rivalries in cricket, contested between England and Australia.' },
          { id: 'fb_test_5', question: 'What is the term for a team losing a Test match by an innings and a certain number of runs?', options: ['Follow-on', 'Innings defeat', 'Clean sweep', 'Whitewash'], correctAnswer: 'Innings defeat', explanation: 'An innings defeat occurs when a team, having been forced to follow-on, is bowled out in their second innings for a total that is still less than the other team\'s first innings score.' },
      ],
  },
  wpl: {
      questions: [
          { id: 'fb_wpl_1', question: 'Which team won the inaugural season of the Women\'s Premier League (WPL) in 2023?', options: ['Delhi Capitals', 'UP Warriorz', 'Mumbai Indians', 'Royal Challengers Bangalore'], correctAnswer: 'Mumbai Indians', explanation: 'Mumbai Indians, led by Harmanpreet Kaur, defeated Delhi Capitals in the final to become the champions of the first-ever WPL season.' },
          { id: 'fb_wpl_2', question: 'Who was the most expensive player in the first WPL auction?', options: ['Smriti Mandhana', 'Ashleigh Gardner', 'Harmanpreet Kaur', 'Ellyse Perry'], correctAnswer: 'Smriti Mandhana', explanation: 'Indian opener Smriti Mandhana was the most expensive buy, acquired by Royal Challengers Bangalore for ₹3.4 crore.' },
          { id: 'fb_wpl_3', question: 'Who won the Orange Cap for the most runs in the inaugural WPL season?', options: ['Meg Lanning', 'Harmanpreet Kaur', 'Shafali Verma', 'Nat Sciver-Brunt'], correctAnswer: 'Meg Lanning', explanation: 'Delhi Capitals\' captain Meg Lanning won the Orange Cap, finishing the tournament as the highest run-scorer.' },
          { id: 'fb_wpl_4', question: 'Who won the Purple Cap for the most wickets in the inaugural WPL season?', options: ['Hayley Matthews', 'Sophie Ecclestone', 'Issy Wong', 'Saika Ishaque'], correctAnswer: 'Hayley Matthews', explanation: 'Mumbai Indians\' all-rounder Hayley Matthews won the Purple Cap for taking the most wickets in the first WPL season.' },
          { id: 'fb_wpl_5', question: 'How many teams participated in the inaugural Women\'s Premier League (WPL)?', options: ['4', '5', '6', '8'], correctAnswer: '5', explanation: 'Five city-based franchises participated in the first season of the WPL: Delhi, Gujarat, Mumbai, Bangalore, and UP.' },
      ],
  },
};

export function getFallbackQuiz(format: string): QuizData {
  const normalizedFormat = format.toLowerCase();
  return fallbackQuizData[normalizedFormat] || fallbackQuizData.mixed;
}
