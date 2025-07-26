
import type { QuizQuestion } from '@/ai/schemas';

export async function getCricketQuestions(): Promise<QuizQuestion[]> {
  return [
    {
      id: "ipl_2023_orange_cap",
      format: "IPL",
      question: "Who won the Orange Cap in IPL 2023?",
      options: ["Shubman Gill", "Faf du Plessis", "Devdutt Padikkal", "David Warner"],
      correctAnswer: "Shubman Gill",
      explanation: "Shubman Gill of the Gujarat Titans scored 890 runs to win the Orange Cap in IPL 2023.",
    },
    {
      id: "highest_odi_avg",
      format: "ODI",
      question: "Which Indian cricketer has the highest ODI batting average (min. 50 innings)?",
      options: ["Virat Kohli", "Rohit Sharma", "Shubman Gill", "MS Dhoni"],
      correctAnswer: "Virat Kohli",
      explanation: "Virat Kohli holds the highest ODI batting average for India, consistently performing above other players.",
    },
    {
      id: "wtc_2023_winner",
      format: "Test",
      question: "Who won the ICC World Test Championship Final in 2023?",
      options: ["India", "Australia", "New Zealand", "England"],
      correctAnswer: "Australia",
      explanation: "Australia defeated India in the 2023 ICC World Test Championship Final at The Oval, London.",
    },
    {
      id: "t20_wc_2022_wickets",
      format: "T20",
      question: "Which bowler took the most wickets in the T20 World Cup 2022?",
      options: ["Wanindu Hasaranga", "Sam Curran", "Arshdeep Singh", "Shadab Khan"],
      correctAnswer: "Wanindu Hasaranga",
      explanation: "Sri Lanka's Wanindu Hasaranga was the leading wicket-taker of the 2022 T20 World Cup with 15 wickets.",
    },
    {
      id: "lbw_full_form",
      format: "Mixed",
      question: "What does LBW stand for in cricket?",
      options: ["Leg Before Wicket", "Long Batting Way", "Line Bowled Wide", "Leg Behind Wicket"],
      correctAnswer: "Leg Before Wicket",
      explanation: "LBW, or Leg Before Wicket, is a common mode of dismissal in cricket.",
    },
    {
        id: "fastest_odi_hundred",
        format: "ODI",
        question: "Who holds the record for the fastest century in ODIs?",
        options: ["AB de Villiers", "Corey Anderson", "Shahid Afridi", "Glenn Maxwell"],
        correctAnswer: "AB de Villiers",
        explanation: "AB de Villiers smashed a century in just 31 balls against the West Indies in 2015.",
    },
    {
        id: "first_hat_trick_ipl",
        format: "IPL",
        question: "Who took the first-ever hat-trick in the IPL?",
        options: ["Lakshmipathy Balaji", "Amit Mishra", "Makhaya Ntini", "Pravin Tambe"],
        correctAnswer: "Lakshmipathy Balaji",
        explanation: "Lakshmipathy Balaji, playing for Chennai Super Kings, took the first hat-trick in IPL history against Kings XI Punjab in 2008.",
    },
    {
        id: "most_test_runs",
        format: "Test",
        question: "Who is the all-time leading run-scorer in Test cricket?",
        options: ["Sachin Tendulkar", "Ricky Ponting", "Jacques Kallis", "Rahul Dravid"],
        correctAnswer: "Sachin Tendulkar",
        explanation: "Sachin Tendulkar holds the record for the most runs in Test cricket, with 15,921 runs in his career.",
    },
    {
        id: "first_t20_wc_winner",
        format: "T20",
        question: "Which country won the inaugural ICC Men's T20 World Cup in 2007?",
        options: ["India", "Pakistan", "Australia", "England"],
        correctAnswer: "India",
        explanation: "India, under MS Dhoni, won the first-ever T20 World Cup in 2007, defeating Pakistan in the final.",
    },
    {
        id: 'wpl_2023_winner',
        format: 'WPL',
        question: 'Which team won the inaugural Women\'s Premier League (WPL) in 2023?',
        options: ['Mumbai Indians', 'Delhi Capitals', 'UP Warriorz', 'Royal Challengers Bangalore'],
        correctAnswer: 'Mumbai Indians',
        explanation: 'Mumbai Indians defeated Delhi Capitals to become the champions of the first-ever WPL season in 2023.',
    },
  ];
}
    