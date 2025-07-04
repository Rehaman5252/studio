import type { QuizQuestion } from '@/ai/schemas';

export interface PredefinedQuestion extends QuizQuestion {
  format: 'IPL' | 'Test' | 'ODI' | 'Mixed';
}

export const allQuestions: PredefinedQuestion[] = [
  // IPL Questions
  {
    questionText: 'Who won the IPL 2024 title?',
    options: [
      'Sunrisers Hyderabad',
      'Royal Challengers Bangalore',
      'Kolkata Knight Riders',
      'Punjab Kings',
    ],
    correctAnswer: 'Kolkata Knight Riders',
    hint: 'This team is co-owned by a Bollywood superstar.',
    format: 'IPL',
  },
  {
    questionText: 'Who was the Orange Cap winner in IPL 2024?',
    options: [
      'Abhishek Sharma',
      'Travis Head',
      'Virat Kohli',
      'Jake Fraser-McGurk',
    ],
    correctAnswer: 'Virat Kohli',
    hint: 'He is the all-time leading run-scorer in IPL history.',
    format: 'IPL',
  },
  {
    questionText: 'Who was the Purple Cap winner in IPL 2024?',
    options: ['Rashid Khan', 'Yuzvendra Chahal', 'Harshal Patel', 'Jasprit Bumrah'],
    correctAnswer: 'Harshal Patel',
    hint: 'He previously won the Purple Cap in 2021.',
    format: 'IPL',
  },
  {
    questionText: 'Which stadium hosted the IPL 2024 final?',
    options: [
      'Eden Gardens',
      'Narendra Modi Stadium',
      'Wankhede Stadium',
      'M. Chinnaswamy Stadium',
    ],
    correctAnswer: 'Narendra Modi Stadium',
    hint: 'It is the largest cricket stadium in the world.',
    format: 'IPL',
  },
  {
    questionText: 'Who was the Player of the Match in the IPL 2024 final?',
    options: [
      'Venkatesh Iyer',
      'Mitchell Starc',
      'Sunil Narine',
      'Rahmanullah Gurbaz',
    ],
    correctAnswer: 'Mitchell Starc',
    hint: 'He is a left-arm fast bowler from Australia.',
    format: 'IPL',
  },
  {
    questionText: 'Who hit the fastest century in IPL history?',
    options: ['Virat Kohli', 'David Warner', 'AB de Villiers', 'Chris Gayle'],
    correctAnswer: 'Chris Gayle',
    hint: 'He is called the "Universe Boss".',
    format: 'IPL',
  },
  {
    questionText: 'Which team has won the most IPL titles as of 2024?',
    options: [
      'Chennai Super Kings',
      'Mumbai Indians',
      'Kolkata Knight Riders',
      'Sunrisers Hyderabad',
    ],
    correctAnswer: 'Chennai Super Kings',
    hint: 'Both CSK and MI have 5 titles as of 2024, but CSK won their fifth most recently.',
    format: 'IPL',
  },
  {
    questionText: 'Which team scored the highest total in IPL history?',
    options: [
      'Royal Challengers Bangalore',
      'Chennai Super Kings',
      'Kolkata Knight Riders',
      'Sunrisers Hyderabad',
    ],
    correctAnswer: 'Sunrisers Hyderabad',
    hint: 'They scored 287/3 in 2024.',
    format: 'IPL',
  },
  {
    questionText: 'Who was the first Indian to win the Orange Cap in IPL?',
    options: ['Sachin Tendulkar', 'Virat Kohli', 'Gautam Gambhir', 'Suresh Raina'],
    correctAnswer: 'Sachin Tendulkar',
    hint: 'He is the "Master Blaster".',
    format: 'IPL',
  },
  {
    questionText: 'Which bowler has taken the most wickets in IPL history as of 2024?',
    options: ['Lasith Malinga', 'Yuzvendra Chahal', 'Dwayne Bravo', 'Sunil Narine'],
    correctAnswer: 'Yuzvendra Chahal',
    hint: 'He is a leg-spinner who played for RCB and RR.',
    format: 'IPL',
  },
  // Test/ODI Questions
  {
    questionText: 'Who was the first Indian to score a triple century in Test cricket?',
    options: [
      'Sunil Gavaskar',
      'Virender Sehwag',
      'Sachin Tendulkar',
      'VVS Laxman',
    ],
    correctAnswer: 'Virender Sehwag',
    hint: 'He scored 309 against Pakistan in Multan.',
    format: 'Test',
  },
  {
    questionText: 'Who was India’s captain during the 1983 World Cup win?',
    options: [
      'Sunil Gavaskar',
      'Kapil Dev',
      'Mohinder Amarnath',
      'Dilip Vengsarkar',
    ],
    correctAnswer: 'Kapil Dev',
    hint: 'An all-rounder and fast bowler.',
    format: 'ODI',
  },
  {
    questionText: 'Who holds the record for the highest individual ODI score by an Indian?',
    options: ['Virender Sehwag', 'Sachin Tendulkar', 'Rohit Sharma', 'Shubman Gill'],
    correctAnswer: 'Rohit Sharma',
    hint: 'He scored 264 runs against Sri Lanka.',
    format: 'ODI',
  },
  {
    questionText: 'Who is India’s leading wicket-taker in Test cricket?',
    options: [
      'Kapil Dev',
      'Ravichandran Ashwin',
      'Anil Kumble',
      'Harbhajan Singh',
    ],
    correctAnswer: 'Anil Kumble',
    hint: 'He took all 10 wickets in an innings vs Pakistan.',
    format: 'Test',
  },
  {
    questionText: 'Who was the first Indian to take a hat-trick in Test cricket?',
    options: [
      'Harbhajan Singh',
      'Anil Kumble',
      'Chetan Sharma',
      'Kapil Dev',
    ],
    correctAnswer: 'Harbhajan Singh',
    hint: 'Achieved against Australia in 2001 at Eden Gardens.',
    format: 'Test',
  },
  {
    questionText: 'Who is the only Indian bowler to take 10 wickets in a Test innings?',
    options: ['Anil Kumble', 'Bishan Singh Bedi', 'Kapil Dev', 'Erapalli Prasanna'],
    correctAnswer: 'Anil Kumble',
    hint: 'Achieved against Pakistan in 1999.',
    format: 'Test',
  },
  {
    questionText: 'Who was the first Indian to score a double century in ODIs?',
    options: [
      'Virender Sehwag',
      'Sachin Tendulkar',
      'Rohit Sharma',
      'Gautam Gambhir',
    ],
    correctAnswer: 'Sachin Tendulkar',
    hint: 'Achieved against South Africa in 2010.',
    format: 'ODI',
  },
  {
    questionText: 'Who holds the record for the fastest ODI century by an Indian?',
    options: ['Virat Kohli', 'Kapil Dev', 'Yuvraj Singh', 'Rohit Sharma'],
    correctAnswer: 'Virat Kohli',
    hint: 'Scored in 52 balls vs Australia, 2013.',
    format: 'ODI',
  },
  {
    questionText: 'Who has the most Test double centuries for India?',
    options: ['Sachin Tendulkar', 'Virat Kohli', 'Rahul Dravid', 'Sunil Gavaskar'],
    correctAnswer: 'Virat Kohli',
    hint: 'Has 7 Test double centuries.',
    format: 'Test',
  },
  {
    questionText: 'Who is the only Indian to have scored a century and taken five wickets in the same Test match?',
    options: ['Kapil Dev', 'Ravi Shastri', 'Hardik Pandya', 'Anil Kumble'],
    correctAnswer: 'Kapil Dev',
    hint: 'Achieved against Pakistan in 1983.',
    format: 'Test',
  },
];
