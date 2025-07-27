
import { v4 as uuidv4 } from 'uuid';
import type { QuizQuestion } from './mockData';

const fallbackQuizzes: Record<string, QuizQuestion[]> = {
  'T20': [
    {
      id: uuidv4(),
      format: 'T20',
      question: "Who holds the record for the fastest century in T20 International history?",
      options: ["Rohit Sharma", "David Miller", "Chris Gayle", "Glenn Maxwell"],
      correctAnswer: "David Miller",
      explanation: "David Miller of South Africa scored a 35-ball century against Bangladesh in 2017.",
    },
    {
      id: uuidv4(),
      format: 'T20',
      question: "Which country won the first-ever ICC Men's T20 World Cup in 2007?",
      options: ["Pakistan", "Australia", "India", "Sri Lanka"],
      correctAnswer: "India",
      explanation: "India defeated Pakistan in a thrilling final in Johannesburg to become the inaugural T20 World Champions.",
    },
    {
      id: uuidv4(),
      format: 'T20',
      question: "What is the maximum number of overs a bowler can bowl in a T20 match?",
      options: ["4", "5", "10", "2"],
      correctAnswer: "4",
      explanation: "In a standard T20 match, each bowler is limited to a maximum of 4 overs.",
    },
    {
      id: uuidv4(),
      format: 'T20',
      question: "Who is the leading run-scorer in the history of T20 Internationals?",
      options: ["Virat Kohli", "Babar Azam", "Rohit Sharma", "Martin Guptill"],
      correctAnswer: "Virat Kohli",
      explanation: "As of recent records, Virat Kohli leads the charts for the most runs scored in T20I cricket history.",
    },
    {
      id: uuidv4(),
      format: 'T20',
      question: "The 'Super Over' is used to decide a tied T20 match. How many balls does each team face?",
      options: ["3", "6", "12", "1"],
      correctAnswer: "6",
      explanation: "A Super Over consists of one over (6 legal deliveries) per team to determine the winner of a tied match.",
    },
  ],
  'IPL': [
    {
      id: uuidv4(),
      format: 'IPL',
      question: "Which team has won the most IPL titles?",
      options: ["Mumbai Indians", "Chennai Super Kings", "Kolkata Knight Riders", "Royal Challengers Bengaluru"],
      correctAnswer: "Mumbai Indians",
      explanation: "Mumbai Indians and Chennai Super Kings have been the most successful teams, with Mumbai Indians often cited as holding the record.",
    },
    {
      id: uuidv4(),
      format: 'IPL',
      question: "Who scored the first-ever century in the history of the IPL?",
      options: ["Sachin Tendulkar", "Chris Gayle", "Brendon McCullum", "Adam Gilchrist"],
      correctAnswer: "Brendon McCullum",
      explanation: "Brendon McCullum lit up the inaugural IPL match in 2008 with a blistering 158* for Kolkata Knight Riders.",
    },
    {
      id: uuidv4(),
      format: 'IPL',
      question: "The 'Orange Cap' is awarded to which player in the IPL?",
      options: ["The leading wicket-taker", "The player with the most sixes", "The leading run-scorer", "The most valuable player"],
      correctAnswer: "The leading run-scorer",
      explanation: "The Orange Cap is awarded to the player who scores the most runs in a single season of the IPL.",
    },
    {
      id: uuidv4(),
      format: 'IPL',
      question: "Which bowler holds the record for the most wickets in IPL history?",
      options: ["Lasith Malinga", "Dwayne Bravo", "Yuzvendra Chahal", "Amit Mishra"],
      correctAnswer: "Yuzvendra Chahal",
      explanation: "Yuzvendra Chahal surpassed Dwayne Bravo to become the all-time leading wicket-taker in the IPL.",
    },
    {
      id: uuidv4(),
      format: 'IPL',
      question: "In which year was the first season of the Indian Premier League (IPL) held?",
      options: ["2007", "2008", "2009", "2010"],
      correctAnswer: "2008",
      explanation: "The inaugural season of the IPL took place in 2008, with Rajasthan Royals emerging as the first champions.",
    },
  ],
   'Test': [
    {
      id: uuidv4(),
      format: 'Test',
      question: "Who is the all-time leading run-scorer in Test cricket?",
      options: ["Ricky Ponting", "Jacques Kallis", "Sachin Tendulkar", "Rahul Dravid"],
      correctAnswer: "Sachin Tendulkar",
      explanation: "Sachin Tendulkar of India holds the record for the most runs in Test history, with over 15,000 runs.",
    },
    {
      id: uuidv4(),
      format: 'Test',
      question: "Which bowler has taken the most wickets in Test match history?",
      options: ["Shane Warne", "Anil Kumble", "James Anderson", "Muttiah Muralitharan"],
      correctAnswer: "Muttiah Muralitharan",
      explanation: "Sri Lanka's Muttiah Muralitharan is the leading wicket-taker in Test cricket with an incredible 800 wickets.",
    },
    {
      id: uuidv4(),
      format: 'Test',
      question: "What is the term for a batsman getting out on the first ball they face?",
      options: ["Golden Duck", "Silver Duck", "Diamond Duck", "Royal Duck"],
      correctAnswer: "Golden Duck",
      explanation: "A 'Golden Duck' refers to a batsman being dismissed on the very first delivery they face.",
    },
    {
      id: uuidv4(),
      format: 'Test',
      question: "What is the highest possible number of days a standard Test match can be played?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "5",
      explanation: "A standard Test match is scheduled to be played over a maximum of five days.",
    },
    {
      id: uuidv4(),
      format: 'Test',
      question: "The Ashes is a famous Test cricket series played between which two countries?",
      options: ["India and Pakistan", "Australia and England", "South Africa and New Zealand", "West Indies and Australia"],
      correctAnswer: "Australia and England",
      explanation: "The Ashes is a historic and fiercely contested Test series played between rivals England and Australia.",
    },
  ],
   'ODI': [
    {
      id: uuidv4(),
      format: 'ODI',
      question: "Who scored the first-ever double century in a men's One Day International (ODI)?",
      options: ["Virender Sehwag", "Rohit Sharma", "Chris Gayle", "Sachin Tendulkar"],
      correctAnswer: "Sachin Tendulkar",
      explanation: "Sachin Tendulkar became the first man to score a double hundred in ODIs against South Africa in 2010.",
    },
    {
      id: uuidv4(),
      format: 'ODI',
      question: "Which country has won the most ICC Cricket World Cups?",
      options: ["India", "West Indies", "Australia", "England"],
      correctAnswer: "Australia",
      explanation: "Australia is the most successful team in World Cup history, having won the tournament multiple times.",
    },
    {
      id: uuidv4(),
      format: 'ODI',
      question: "What is the maximum number of overs in a standard ODI innings?",
      options: ["40", "50", "60", "90"],
      correctAnswer: "50",
      explanation: "A standard One Day International match consists of 50 overs per side.",
    },
    {
      id: uuidv4(),
      format: 'ODI',
      question: "Who holds the record for the most wickets in ODIs?",
      options: ["Wasim Akram", "Waqar Younis", "Muttiah Muralitharan", "Glenn McGrath"],
      correctAnswer: "Muttiah Muralitharan",
      explanation: "Sri Lankan spinner Muttiah Muralitharan holds the record for the most wickets in ODI history with over 500 scalps.",
    },
    {
      id: uuidv4(),
      format: 'ODI',
      question: "In ODI cricket, what do the first 10 overs of an innings constitute?",
      options: ["The Death Overs", "The Powerplay", "The Middle Overs", "The Opening Stand"],
      correctAnswer: "The Powerplay",
      explanation: "The initial phase of an ODI innings, typically the first 10 overs, is known as the Powerplay, which has fielding restrictions.",
    },
  ],
   'WPL': [
    {
      id: uuidv4(),
      format: 'WPL',
      question: "Which team won the inaugural season of the Women's Premier League (WPL) in 2023?",
      options: ["Delhi Capitals", "Mumbai Indians", "UP Warriorz", "Royal Challengers Bangalore"],
      correctAnswer: "Mumbai Indians",
      explanation: "Mumbai Indians, led by Harmanpreet Kaur, defeated Delhi Capitals to win the first-ever WPL title in 2023.",
    },
    {
      id: uuidv4(),
      format: 'WPL',
      question: "Who was the most expensive player sold at the first WPL auction?",
      options: ["Smriti Mandhana", "Harmanpreet Kaur", "Ashleigh Gardner", "Ellyse Perry"],
      correctAnswer: "Smriti Mandhana",
      explanation: "Smriti Mandhana was the highest-paid player, bought by Royal Challengers Bangalore for ₹3.4 crore.",
    },
    {
      id: uuidv4(),
      format: 'WPL',
      question: "The 'Purple Cap' in the WPL is awarded for what achievement?",
      options: ["Most Runs", "Most Wickets", "Most Sixes", "Player of the Tournament"],
      correctAnswer: "Most Wickets",
      explanation: "Similar to the IPL, the Purple Cap in the WPL is awarded to the bowler who takes the most wickets in the season.",
    },
    {
      id: uuidv4(),
      format: 'WPL',
      question: "How many teams participated in the first season of the WPL?",
      options: ["4", "5", "6", "8"],
      correctAnswer: "5",
      explanation: "The inaugural WPL season featured five city-based franchises: Delhi, Gujarat, Mumbai, Bangalore, and UP.",
    },
    {
      id: uuidv4(),
      format: 'WPL',
      question: "Which player won the Orange Cap in the first season of the WPL?",
      options: ["Shafali Verma", "Harmanpreet Kaur", "Meg Lanning", "Nat Sciver-Brunt"],
      correctAnswer: "Meg Lanning",
      explanation: "Meg Lanning, captain of the Delhi Capitals, won the Orange Cap for being the leading run-scorer in the 2023 WPL.",
    },
  ],
};

fallbackQuizzes['Mixed'] = fallbackQuizzes['T20']; // Default Mixed to T20 questions

/**
 * Retrieves a set of high-quality, pre-defined fallback questions for a given format.
 * Guarantees a valid 5-question quiz is always returned.
 * @param format The cricket format (e.g., T20, IPL).
 * @returns An array of 5 QuizQuestion objects.
 */
export function getFallbackQuestions(format: string): QuizQuestion[] {
  return fallbackQuizzes[format] || fallbackQuizzes['Mixed'];
}
