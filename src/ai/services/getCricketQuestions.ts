
import type { QuizQuestion } from '../schemas';

export async function getCricketQuestions(): Promise<QuizQuestion[]> {
  return [
    // IPL Questions
    { id: 'ipl1', format: 'IPL', question: 'Which team has won the most IPL titles?', options: ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru'], correctAnswer: 'Mumbai Indians' },
    { id: 'ipl2', format: 'IPL', question: 'Who is the all-time leading run-scorer in the IPL?', options: ['Virat Kohli', 'Shikhar Dhawan', 'David Warner', 'Rohit Sharma'], correctAnswer: 'Virat Kohli' },
    { id: 'ipl3', format: 'IPL', question: 'Who took the first-ever hat-trick in the IPL?', options: ['Lakshmipathy Balaji', 'Amit Mishra', 'Yuvraj Singh', 'Makhaya Ntini'], correctAnswer: 'Lakshmipathy Balaji' },
    { id: 'ipl4', format: 'IPL', question: 'Which player holds the record for the highest individual score in an IPL match?', options: ['Chris Gayle', 'Brendon McCullum', 'AB de Villiers', 'KL Rahul'], correctAnswer: 'Chris Gayle' },
    { id: 'ipl5', format: 'IPL', question: 'In which year was the first IPL season played?', options: ['2008', '2007', '2009', '2010'], correctAnswer: '2008' },

    // T20 Questions
    { id: 't201', format: 'T20', question: 'Which country won the first-ever ICC T20 World Cup?', options: ['India', 'Pakistan', 'Australia', 'England'], correctAnswer: 'India' },
    { id: 't202', format: 'T20', question: 'Who holds the record for the fastest century in T20 international cricket?', options: ['David Miller', 'Rohit Sharma', 'Chris Gayle', 'Suryakumar Yadav'], correctAnswer: 'David Miller' },
    { id: 't203', format: 'T20', question: 'What is the maximum number of overs a bowler can bowl in a T20 match?', options: ['4', '5', '3', '6'], correctAnswer: '4' },
    { id: 't204', format: 'T20', question: 'Who is the leading wicket-taker in T20 Internationals?', options: ['Tim Southee', 'Shakib Al Hasan', 'Rashid Khan', 'Lasith Malinga'], correctAnswer: 'Tim Southee' },
    { id: 't205', format: 'T20', question: 'A "Super Over" is used to decide a tied T20 match. How many balls does each team face?', options: ['6', '12', '3', '1'], correctAnswer: '6' },

    // ODI Questions
    { id: 'odi1', format: 'ODI', question: 'Which country has won the most ICC Cricket World Cups?', options: ['Australia', 'India', 'West Indies', 'England'], correctAnswer: 'Australia' },
    { id: 'odi2', format: 'ODI', question: 'Who holds the record for the highest individual score in an ODI match?', options: ['Rohit Sharma', 'Martin Guptill', 'Virender Sehwag', 'Chris Gayle'], correctAnswer: 'Rohit Sharma' },
    { id: 'odi3', format: 'ODI', question: 'How many balls are there in one over in ODI cricket?', options: ['6', '8', '10', '5'], correctAnswer: '6' },
    { id: 'odi4', format: 'ODI', question: 'Who is the fastest player to score 10,000 ODI runs?', options: ['Virat Kohli', 'Sachin Tendulkar', 'Ricky Ponting', 'Babar Azam'], correctAnswer: 'Virat Kohli' },
    { id: 'odi5', format: 'ODI', question: 'The Duckworth-Lewis-Stern (DLS) method is used for what purpose in ODI cricket?', options: ['Deciding matches affected by rain', 'Ranking teams', 'Third umpire decisions', 'Player auctions'], correctAnswer: 'Deciding matches affected by rain' },

    // Test Questions
    { id: 'test1', format: 'Test', question: 'Who is the all-time leading wicket-taker in Test cricket history?', options: ['Muttiah Muralitharan', 'Shane Warne', 'James Anderson', 'Anil Kumble'], correctAnswer: 'Muttiah Muralitharan' },
    { id: 'test2', format: 'Test', question: 'What is the highest team total ever recorded in a Test innings?', options: ['952/6d (Sri Lanka)', '903/7d (England)', '790/3d (West Indies)', '849 (England)'], correctAnswer: '952/6d (Sri Lanka)' },
    { id: 'test3', format: 'Test', question: 'A Test match is typically played over how many days?', options: ['5', '3', '7', '1'], correctAnswer: '5' },
    { id: 'test4', format: 'Test', question: 'Who has scored the most triple centuries in Test cricket?', options: ['Don Bradman', 'Virender Sehwag', 'Brian Lara', 'Chris Gayle'], correctAnswer: 'Don Bradman' },
    { id: 'test5', format: 'Test', question: 'What does "follow-on" mean in Test cricket?', options: ['Forcing the team that batted second to bat again immediately', 'A type of spin bowling', 'A fielding position', 'A batsman scoring consecutive centuries'], correctAnswer: 'Forcing the team that batted second to bat again immediately' },

    // WPL Questions
    { id: 'wpl1', format: 'WPL', question: 'Which team won the inaugural season of the Women\'s Premier League (WPL) in 2023?', options: ['Mumbai Indians', 'Delhi Capitals', 'UP Warriorz', 'Royal Challengers Bangalore'], correctAnswer: 'Mumbai Indians' },
    { id: 'wpl2', format: 'WPL', question: 'Who was the most expensive player in the first WPL auction?', options: ['Smriti Mandhana', 'Ashleigh Gardner', 'Nat Sciver-Brunt', 'Harmanpreet Kaur'], correctAnswer: 'Smriti Mandhana' },
    { id: 'wpl3', format: 'WPL', question: 'The WPL is the women\'s equivalent of which major T20 league?', options: ['IPL', 'BBL', 'The Hundred', 'CPL'], correctAnswer: 'IPL' },
    { id: 'wpl4', format: 'WPL', question: 'How many teams participated in the first season of the WPL?', options: ['5', '6', '8', '4'], correctAnswer: '5' },
    { id: 'wpl5', format: 'WPL', question: 'Who won the Orange Cap for the most runs in the WPL 2023 season?', options: ['Meg Lanning', 'Shafali Verma', 'Harmanpreet Kaur', 'Sophie Devine'], correctAnswer: 'Meg Lanning' },
  ];
}
