
import type { QuizData, QuizQuestion } from '@/ai/schemas';
import { db } from './firebase';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';

/**
 * @fileOverview Fallback quiz data and Firestore fetching logic.
 *
 * This file provides a scalable fallback mechanism for quizzes. If the primary AI generation
 * fails, the system fetches a random set of questions from the 'fallback_questions'
 * collection in Firestore. This ensures high availability and variety.
 *
 * A seed function `seedFallbackQuestions` is also provided to populate the database with
 * an initial set of questions.
 */


/**
 * Fetches a random quiz from the 'fallback_questions' collection in Firestore.
 * @param format - The cricket format to fetch questions for.
 * @returns A promise that resolves to a QuizData object.
 */
export async function getFallbackQuiz(format: string): Promise<QuizData> {
  const normalizedFormat = format.toLowerCase();
  
  if (!db) {
    console.warn("Firestore not initialized, using local fallback questions.");
    const localFallback = allFallbackQuestions.filter(q => q.format.toLowerCase() === normalizedFormat);
    return { questions: shuffleArray(localFallback).slice(0, 5) as QuizQuestion[] };
  }

  try {
    const questionsCollection = collection(db, 'fallback_questions');
    // Firestore doesn't have a native "random" function. We can simulate it
    // by ordering by a random key and taking the first 5.
    const randomId = Math.random().toString();
    
    const q = query(
        questionsCollection, 
        where("format", "==", normalizedFormat),
        where("__name__", ">=", randomId),
        limit(5)
    );

    let querySnapshot = await getDocs(q);

    // If the query returns fewer than 5 docs, it means we hit the end of the collection.
    // We can run a second query starting from the beginning to fill the gap.
    const questions: QuizQuestion[] = querySnapshot.docs.map(doc => doc.data() as QuizQuestion);

    if (questions.length < 5) {
        const remaining = 5 - questions.length;
        const secondQuery = query(
            questionsCollection,
            where("format", "==", normalizedFormat),
            where("__name__", "<", randomId),
            limit(remaining)
        );
        const secondSnapshot = await getDocs(secondQuery);
        questions.push(...secondSnapshot.docs.map(doc => doc.data() as QuizQuestion));
    }
    
    // If we still don't have questions (e.g., empty collection), use the hardcoded list.
    if (questions.length === 0) {
        throw new Error(`No fallback questions found in Firestore for format: ${normalizedFormat}`);
    }

    return { questions: shuffleArray(questions).slice(0, 5) };

  } catch (error) {
    console.error("Error fetching fallback quiz from Firestore, using local data:", error);
    const localFallback = allFallbackQuestions.filter(q => q.format.toLowerCase() === normalizedFormat);
    if(localFallback.length === 0) {
       return { questions: shuffleArray(allFallbackQuestions).slice(0, 5) as QuizQuestion[] };
    }
    return { questions: shuffleArray(localFallback).slice(0, 5) as QuizQuestion[] };
  }
}

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --------------------------------------------------------------------------
// --- SEED DATA: 120 Questions (20 per format) ---
// --------------------------------------------------------------------------
// This data is intended to be seeded into the 'fallback_questions' collection.
export const allFallbackQuestions: (Omit<QuizQuestion, 'id'> & { format: string })[] = [
    // ----- MIXED (20) -----
    { format: 'mixed', question: 'What is the term for a score of 111 in cricket?', options: ['Century', 'Duckworth', 'Nelson', 'Hat-trick'], correctAnswer: 'Nelson', explanation: 'A score of 111 is known as a "Nelson" in cricket, considered unlucky by some.' },
    { format: 'mixed', question: 'Which bowler has the most wickets in all forms of international cricket combined?', options: ['Shane Warne', 'James Anderson', 'Anil Kumble', 'Muttiah Muralitharan'], correctAnswer: 'Muttiah Muralitharan', explanation: 'Muttiah Muralitharan of Sri Lanka has taken over 1300 wickets in international cricket.' },
    { format: 'mixed', question: 'What is the "DLS" method used for in cricket?', options: ['Checking for no-balls', 'Calculating revised targets in rain-affected matches', 'Reviewing umpiring decisions', 'Measuring pitch hardness'], correctAnswer: 'Calculating revised targets in rain-affected matches', explanation: 'The Duckworth-Lewis-Stern (DLS) method is a mathematical formulation designed to calculate the target score for the team batting second in a limited-overs match interrupted by weather or other circumstances.' },
    { format: 'mixed', question: 'How many players are there on a standard cricket team?', options: ['9', '10', '11', '12'], correctAnswer: '11', explanation: 'A standard cricket team consists of eleven players.' },
    { format: 'mixed', question: 'What type of delivery is a "yorker"?', options: ['A very short, fast ball', 'A slow, spinning ball', 'A ball that bounces twice', 'A ball aimed at the batsman\'s feet'], correctAnswer: 'A ball aimed at the batsman\'s feet', explanation: 'A yorker is a difficult delivery to play as it is pitched very full, right at the base of the stumps or the batsman\'s toes.' },
    { format: 'mixed', question: 'Which country is credited with inventing the game of cricket?', options: ['Australia', 'India', 'South Africa', 'England'], correctAnswer: 'England', explanation: 'Cricket is believed to have originated in south-east England in the 16th century.' },
    { format: 'mixed', question: 'What is the name of the trophy awarded for the Test series between Australia and England?', options: ['The Border-Gavaskar Trophy', 'The Ashes', 'The Chappell-Hadlee Trophy', 'The Frank Worrell Trophy'], correctAnswer: 'The Ashes', explanation: 'The Ashes is a historic Test cricket series played between England and Australia, named after a satirical obituary published in 1882.' },
    { format: 'mixed', question: 'In cricket, what does "mankading" refer to?', options: ['A type of spin bowling', 'A fielding position', 'Running out the non-striker before the ball is bowled', 'Hitting the wicket with the bat'], correctAnswer: 'Running out the non-striker before the ball is bowled', explanation: 'Named after Vinoo Mankad, it\'s the act of a bowler running out the non-striking batsman who has backed up too far.' },
    { format: 'mixed', question: 'Who was the first batsman to score 10,000 runs in Test cricket?', options: ['Don Bradman', 'Sunil Gavaskar', 'Viv Richards', 'Allan Border'], correctAnswer: 'Sunil Gavaskar', explanation: 'India\'s Sunil Gavaskar was the first cricketer to reach the milestone of 10,000 runs in Test matches.' },
    { format: 'mixed', question: 'A "maiden over" is an over in which...?', options: ['A wicket is taken', 'No runs are scored off the bat', 'Only extras are scored', 'A batsman scores a century'], correctAnswer: 'No runs are scored off the bat', explanation: 'A maiden over is an over where the bowler does not concede any runs that are attributed to them (though extras like byes can still be scored).' },
    { format: 'mixed', question: 'What is the weight of a standard cricket ball?', options: ['100g-110g', '155.9g-163g', '180g-190g', '200g-210g'], correctAnswer: '155.9g-163g', explanation: 'A standard red cricket ball weighs between 155.9 and 163 grams.' },
    { format: 'mixed', question: 'The term "chinaman" is used to describe what in cricket?', options: ['A left-arm unorthodox spin bowler', 'A right-arm fast bowler', 'A switch-hitting batsman', 'A deep square leg fielder'], correctAnswer: 'A left-arm unorthodox spin bowler', explanation: 'A "chinaman" is a type of delivery bowled by a left-arm slow bowler that spins from off to leg for a right-handed batsman.' },
    { format: 'mixed', question: 'Which player is known as the "Rawalpindi Express"?', options: ['Wasim Akram', 'Waqar Younis', 'Shoaib Akhtar', 'Imran Khan'], correctAnswer: 'Shoaib Akhtar', explanation: 'Shoaib Akhtar from Pakistan was nicknamed the "Rawalpindi Express" for being one of the fastest bowlers in history.' },
    { format: 'mixed', question: 'What is the follow-on in Test cricket?', options: ['The second innings of a match', 'A penalty for slow over-rate', 'Forcing a team to bat again immediately after their first innings', 'A type of spin delivery'], correctAnswer: 'Forcing a team to bat again immediately after their first innings', explanation: 'If a team\'s first innings total is significantly lower than their opponent\'s, the opponent can enforce the follow-on, making them bat again.' },
    { format: 'mixed', question: 'Who has the record for the most catches by a non-wicketkeeper in Test history?', options: ['Ricky Ponting', 'Mahela Jayawardene', 'Jacques Kallis', 'Rahul Dravid'], correctAnswer: 'Rahul Dravid', explanation: 'Rahul Dravid of India holds the world record for the most catches by a non-wicketkeeper in Test cricket with 210 catches.' },
    { format: 'mixed', question: 'The "UDRS" system in cricket stands for what?', options: ['Umpire Decision Review System', 'Ultimate Driver-Rating System', 'Under-arm Delivery Rule System', 'Unified Data Reporting Standard'], correctAnswer: 'Umpire Decision Review System', explanation: 'The UDRS, or simply DRS, is a technology-based system used to assist the on-field umpires in their decision-making.' },
    { format: 'mixed', question: 'What is the length of a standard cricket pitch?', options: ['20 yards', '22 yards', '24 yards', '26 yards'], correctAnswer: '22 yards', explanation: 'A standard cricket pitch measures 22 yards (20.12 metres) from wicket to wicket.' },
    { format: 'mixed', question: 'Which cricketer has the nickname "Punter"?', options: ['Adam Gilchrist', 'Matthew Hayden', 'Ricky Ponting', 'Shane Warne'], correctAnswer: 'Ricky Ponting', explanation: 'Former Australian captain Ricky Ponting is widely known by his nickname "Punter".' },
    { format: 'mixed', question: 'A "beamer" in cricket is a delivery that...', options: ['Bounces over the batsman\'s head', 'Is bowled underarm', 'Reaches the batsman at head height without bouncing', 'Hits the spider-cam'], correctAnswer: 'Reaches the batsman at head height without bouncing', explanation: 'A beamer is an illegal and dangerous delivery that passes the batsman at or above head height without bouncing.' },
    { format: 'mixed', question: 'Who is the only batsman to score 400 runs in a single Test innings?', options: ['Don Bradman', 'Virender Sehwag', 'Chris Gayle', 'Brian Lara'], correctAnswer: 'Brian Lara', explanation: 'Brian Lara of the West Indies scored an unbeaten 400 against England in 2004, the only quadruple century in Test history.' },

    // ----- IPL (20) -----
    { format: 'ipl', question: 'Who was the first Indian to score a century in the IPL?', options: ['Sachin Tendulkar', 'Gautam Gambhir', 'Manish Pandey', 'Virender Sehwag'], correctAnswer: 'Manish Pandey', explanation: 'Manish Pandey, playing for Royal Challengers Bangalore, became the first Indian to score an IPL century in 2009.' },
    { format: 'ipl', question: 'The "Strategic Timeout" in the IPL lasts for how long?', options: ['1 minute', '2 minutes 30 seconds', '3 minutes', '5 minutes'], correctAnswer: '2 minutes 30 seconds', explanation: 'Each IPL innings has two strategic timeouts, each lasting two and a half minutes.' },
    { format: 'ipl', question: 'Which two teams played the first-ever IPL match in 2008?', options: ['CSK vs MI', 'DC vs RR', 'RCB vs KKR', 'PBKS vs SRH'], correctAnswer: 'RCB vs KKR', explanation: 'The first IPL match was between Royal Challengers Bangalore and Kolkata Knight Riders, famous for Brendon McCullum\'s 158*.' },
    { format: 'ipl', question: 'Who holds the record for the most dot balls bowled in IPL history?', options: ['Bhuvneshwar Kumar', 'Lasith Malinga', 'Piyush Chawla', 'Sunil Narine'], correctAnswer: 'Bhuvneshwar Kumar', explanation: 'Bhuvneshwar Kumar is renowned for his economical bowling and holds the record for the most dot balls in the IPL.' },
    { format: 'ipl', question: 'Which team was the runner-up in the inaugural IPL season in 2008?', options: ['Mumbai Indians', 'Chennai Super Kings', 'Delhi Daredevils', 'Kings XI Punjab'], correctAnswer: 'Chennai Super Kings', explanation: 'Rajasthan Royals defeated Chennai Super Kings in the final of the 2008 IPL.' },
    { format: 'ipl', question: 'Who has the most "Player of the Match" awards in the IPL?', options: ['Chris Gayle', 'Rohit Sharma', 'AB de Villiers', 'MS Dhoni'], correctAnswer: 'AB de Villiers', explanation: 'AB de Villiers holds the record for the most Man of the Match awards in IPL history for his incredible performances.' },
    { format: 'ipl', question: 'Which team bought Shane Warne in the inaugural IPL auction?', options: ['Deccan Chargers', 'Kolkata Knight Riders', 'Rajasthan Royals', 'Kings XI Punjab'], correctAnswer: 'Rajasthan Royals', explanation: 'Shane Warne was the captain and coach of the Rajasthan Royals, leading them to victory in the first-ever IPL season.' },
    { format: 'ipl', question: 'What is the name of the stadium that serves as the home ground for Chennai Super Kings?', options: ['Wankhede Stadium', 'Eden Gardens', 'M. A. Chidambaram Stadium', 'M. Chinnaswamy Stadium'], correctAnswer: 'M. A. Chidambaram Stadium', explanation: 'The M. A. Chidambaram Stadium, also known as Chepauk, is the home ground for CSK.' },
    { format: 'ipl', question: 'Who was the first player to reach 5,000 runs in the IPL?', options: ['Virat Kohli', 'David Warner', 'Suresh Raina', 'Rohit Sharma'], correctAnswer: 'Suresh Raina', explanation: 'Suresh Raina, also known as "Mr. IPL", was the first batsman to cross the 5,000 run milestone in the tournament.' },
    { format: 'ipl', question: 'Which player has taken the most hat-tricks in the IPL?', options: ['Yuvraj Singh', 'Amit Mishra', 'Lasith Malinga', 'Sunil Narine'], correctAnswer: 'Amit Mishra', explanation: 'Leg-spinner Amit Mishra holds the record for the most hat-tricks in the history of the IPL, with three to his name.' },
    { format: 'ipl', question: 'Which IPL team was suspended for two seasons (2016, 2017) along with Rajasthan Royals?', options: ['Kochi Tuskers Kerala', 'Pune Warriors India', 'Chennai Super Kings', 'Deccan Chargers'], correctAnswer: 'Chennai Super Kings', explanation: 'CSK and RR were suspended for two years due to a betting scandal, making way for two new temporary teams.' },
    { format: 'ipl', question: 'Who has the record for the fastest fifty in IPL history?', options: ['KL Rahul', 'Yashasvi Jaiswal', 'Pat Cummins', 'Sunil Narine'], correctAnswer: 'Yashasvi Jaiswal', explanation: 'Yashasvi Jaiswal broke the record for the fastest IPL fifty, reaching the milestone in just 13 balls for Rajasthan Royals in 2023.' },
    { format: 'ipl', question: 'Which two teams were introduced as new franchises in the 2022 IPL season?', options: ['Pune and Rajkot', 'Kochi and Pune', 'Lucknow and Gujarat', 'Ahmedabad and Lucknow'], correctAnswer: 'Lucknow and Gujarat', explanation: 'Lucknow Super Giants and Gujarat Titans were the two new teams added in the 2022 edition of the IPL.' },
    { format: 'ipl', question: 'Who was the "Emerging Player of the Year" in IPL 2023?', options: ['Tilak Varma', 'Yashasvi Jaiswal', 'Rinku Singh', 'Matheesha Pathirana'], correctAnswer: 'Yashasvi Jaiswal', explanation: 'Yashasvi Jaiswal won the Emerging Player award for his spectacular season with the Rajasthan Royals in IPL 2023.' },
    { format: 'ipl', question: 'Which bowler has the best bowling figures in an IPL match?', options: ['Anil Kumble', 'Alzarri Joseph', 'Adam Zampa', 'Sohail Tanvir'], correctAnswer: 'Alzarri Joseph', explanation: 'Alzarri Joseph recorded figures of 6 wickets for 12 runs for Mumbai Indians on his IPL debut, the best in the tournament\'s history.' },
    { format: 'ipl', question: 'Which player has hit the most sixes in the history of the IPL?', options: ['AB de Villiers', 'Rohit Sharma', 'MS Dhoni', 'Chris Gayle'], correctAnswer: 'Chris Gayle', explanation: 'Chris Gayle, the "Universe Boss", holds the record for hitting the most sixes in the IPL by a significant margin.' },
    { format: 'ipl', question: 'Which team did Brendon McCullum score his famous 158* against in the first-ever IPL match?', options: ['Deccan Chargers', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Mumbai Indians'], correctAnswer: 'Royal Challengers Bangalore', explanation: 'Playing for KKR, Brendon McCullum lit up the inaugural IPL match with a blistering 158* against RCB.' },
    { format: 'ipl', question: 'The "Purple Cap" is awarded to which player?', options: ['The player with the most runs', 'The player with the most wickets', 'The most valuable player', 'The player with the best strike rate'], correctAnswer: 'The player with the most wickets', explanation: 'The Purple Cap is awarded to the bowler who takes the most wickets in a single season of the IPL.' },
    { format: 'ipl', question: 'In which year did the IPL tournament start?', options: ['2007', '2008', '2009', '2010'], correctAnswer: '2008', explanation: 'The inaugural season of the Indian Premier League took place in 2008.' },
    { format: 'ipl', question: 'Which player has played for the most IPL franchises?', options: ['Dinesh Karthik', 'Parthiv Patel', 'Aaron Finch', 'Thisara Perera'], correctAnswer: 'Aaron Finch', explanation: 'Australian batsman Aaron Finch holds the record for representing the most IPL franchises, having played for 9 different teams.' },

    // ----- T20 (20) -----
    { format: 't20', question: 'Which team won the first-ever ICC Men\'s T20 World Cup in 2007?', options: ['Pakistan', 'Australia', 'England', 'India'], correctAnswer: 'India', explanation: 'India, under the captaincy of MS Dhoni, won the inaugural T20 World Cup by defeating Pakistan in the final.' },
    { format: 't20', question: 'What is the maximum number of bowlers that can bowl in a T20 innings?', options: ['4', '5', '6', '11'], correctAnswer: '11', explanation: 'Any of the 11 players on the team can be asked to bowl, though it is rare to see more than 6 or 7 used.' },
    { format: 't20', question: 'A bowler can bowl a maximum of how many overs in a T20 match?', options: ['2', '3', '4', '5'], correctAnswer: '4', explanation: 'In a standard 20-over T20 match, each bowler is limited to a maximum of 4 overs.' },
    { format: 't20', question: 'Who holds the record for the highest individual score in a T20 International?', options: ['Aaron Finch', 'Chris Gayle', 'Hazratullah Zazai', 'Rohit Sharma'], correctAnswer: 'Aaron Finch', explanation: 'Australia\'s Aaron Finch scored 172 against Zimbabwe in 2018, the highest individual score in a T20I.' },
    { format: 't20', question: 'Which two nations played the first-ever Men\'s T20 International match?', options: ['England and Australia', 'Australia and New Zealand', 'India and Pakistan', 'South Africa and West Indies'], correctAnswer: 'Australia and New Zealand', explanation: 'The first Men\'s T20I was played between Australia and New Zealand in Auckland on 17 February 2005.' },
    { format: 't20', question: 'The Big Bash League (BBL) is the domestic T20 competition of which country?', options: ['England', 'South Africa', 'Australia', 'New Zealand'], correctAnswer: 'Australia', explanation: 'The Big Bash League is Australia\'s popular franchise-based T20 cricket tournament.' },
    { format: 't20', question: 'Who was the first player to score a century in a T20 International?', options: ['Brendon McCullum', 'Suresh Raina', 'Chris Gayle', 'Richard Levi'], correctAnswer: 'Chris Gayle', explanation: 'Chris Gayle scored the first-ever T20I century (117) against South Africa in the opening match of the 2007 T20 World Cup.' },
    { format: 't20', question: 'What is a "free hit" in T20 cricket?', options: ['A bonus run', 'The batsman cannot be out on the next ball', 'A delivery that must be hit for six', 'The fielding team can choose the batsman'], correctAnswer: 'The batsman cannot be out on the next ball', explanation: 'After a no-ball, the subsequent delivery is a "free hit," on which the batsman can only be dismissed via a run-out.' },
    { format: 't20', question: 'Which player has the most ducks (scores of 0) in T20 Internationals?', options: ['Shahid Afridi', 'Kevin O\'Brien', 'Paul Stirling', 'Soumya Sarkar'], correctAnswer: 'Kevin O\'Brien', explanation: 'Ireland\'s Kevin O\'Brien holds the unfortunate record for the most ducks in T20I history.' },
    { format: 't20', question: 'Which country hosted the 2021 ICC Men\'s T20 World Cup?', options: ['India', 'Australia', 'UAE and Oman', 'Sri Lanka'], correctAnswer: 'UAE and Oman', explanation: 'Although originally scheduled for India, the 2021 T20 World Cup was shifted to the United Arab Emirates and Oman due to the COVID-19 pandemic.' },
    { format: 't20', question: 'Who has the best bowling figures in a T20 International match?', options: ['Deepak Chahar', 'Ajantha Mendis', 'Peter Aho', 'Yuzvendra Chahal'], correctAnswer: 'Peter Aho', explanation: 'Nigeria\'s Peter Aho holds the record with incredible figures of 6 wickets for 5 runs against Sierra Leone in 2021.' },
    { format: 't20', question: 'What is the record for the highest team total in a T20 International?', options: ['278/3 by Afghanistan', '263/5 by RCB', '260/6 by Sri Lanka', '290/2 by Sunrisers Hyderabad'], correctAnswer: '278/3 by Afghanistan', explanation: 'Afghanistan scored 278/3 against Ireland in 2019, which is the highest team total in a T20 International match.' },
    { format: 't20', question: 'The Caribbean Premier League (CPL) is a domestic T20 league for which region?', options: ['Australia', 'West Indies', 'South Africa', 'England'], correctAnswer: 'West Indies', explanation: 'The CPL is an annual T20 cricket tournament held in the Caribbean.' },
    { format: 't20', question: 'Who has the record for the fastest century in T20I history?', options: ['David Miller', 'Rohit Sharma', 'Suryakumar Yadav', 'Kushal Malla'], correctAnswer: 'Kushal Malla', explanation: 'Nepal\'s Kushal Malla scored a century in just 34 balls against Mongolia in 2023, setting a new world record.' },
    { format: 't20', question: 'Which team won the 2022 ICC Men\'s T20 World Cup?', options: ['India', 'Pakistan', 'England', 'New Zealand'], correctAnswer: 'England', explanation: 'England defeated Pakistan in the final to win the 2022 ICC Men\'s T20 World Cup in Australia.' },
    { format: 't20', question: 'Who is the only player to take two hat-tricks in T20 World Cups?', options: ['Lasith Malinga', 'Brett Lee', 'Wanindu Hasaranga', 'Kagiso Rabada'], correctAnswer: 'Wanindu Hasaranga', explanation: 'Sri Lankan spinner Wanindu Hasaranga is the only bowler to have claimed two hat-tricks in T20 World Cup history.' },
    { format: 't20', question: 'What is the Duckworth-Lewis-Stern (DLS) method primarily used for?', options: ['To decide the Man of the Match', 'To calculate revised targets in rain-shortened games', 'To measure the speed of the ball', 'To review run-out decisions'], correctAnswer: 'To calculate revised targets in rain-shortened games', explanation: 'The DLS method is a mathematical formula used to set a fair target for the team batting second in a match interrupted by weather.' },
    { format: 't20', question: 'Who was the first captain to win two T20 World Cup trophies?', options: ['MS Dhoni', 'Daren Sammy', 'Eoin Morgan', 'Aaron Finch'], correctAnswer: 'Daren Sammy', explanation: 'Daren Sammy captained the West Indies to victory in both the 2012 and 2016 T20 World Cups.' },
    { format: 't20', question: 'The term "Super Striker of the Season" is associated with which T20 league?', options: ['Big Bash League', 'Pakistan Super League', 'Indian Premier League', 'Caribbean Premier League'], correctAnswer: 'Indian Premier League', explanation: 'The IPL awards the "Super Striker of the Season" to the batsman with the highest strike rate (with a minimum number of balls faced).' },
    { format: 't20', question: 'What is the name of England\'s domestic T20 competition?', options: ['The Hundred', 'T20 Blast', 'County Championship', 'One-Day Cup'], correctAnswer: 'T20 Blast', explanation: 'The T20 Blast is the professional Twenty20 cricket competition for first-class counties in England and Wales.' },

    // ----- ODI (20) -----
    { format: 'odi', question: 'Who is the fastest player to reach 10,000 runs in ODIs?', options: ['Sachin Tendulkar', 'Virat Kohli', 'Ricky Ponting', 'Rohit Sharma'], correctAnswer: 'Virat Kohli', explanation: 'Virat Kohli is the fastest to the 10,000-run mark in ODIs, achieving it in just 205 innings.' },
    { format: 'odi', question: 'Which bowler has taken the most wickets in a single Cricket World Cup tournament?', options: ['Glenn McGrath', 'Mitchell Starc', 'Muttiah Muralitharan', 'Shaun Tait'], correctAnswer: 'Mitchell Starc', explanation: 'Mitchell Starc of Australia took 27 wickets in the 2019 World Cup, a record for a single tournament.' },
    { format: 'odi', question: 'Who is the only player to have scored three double centuries in ODIs?', options: ['Sachin Tendulkar', 'Virender Sehwag', 'Chris Gayle', 'Rohit Sharma'], correctAnswer: 'Rohit Sharma', explanation: 'Rohit Sharma of India has uniquely scored three double hundreds in One Day Internationals.' },
    { format: 'odi', question: 'Which country has appeared in the most Cricket World Cup finals?', options: ['India', 'England', 'West Indies', 'Australia'], correctAnswer: 'Australia', explanation: 'Australia holds the record for playing in the most ICC Cricket World Cup finals.' },
    { format: 'odi', question: 'What are the fielding restrictions during the final 10 overs (41-50) of an ODI innings?', options: ['Max 2 fielders outside the circle', 'Max 3 fielders outside the circle', 'Max 4 fielders outside the circle', 'Max 5 fielders outside the circle'], correctAnswer: 'Max 5 fielders outside the circle', explanation: 'In the final powerplay (overs 41-50), a maximum of five fielders are allowed outside the 30-yard circle.' },
    { format: 'odi', question: 'Who has the record for the most dismissals by a wicket-keeper in ODIs?', options: ['Adam Gilchrist', 'MS Dhoni', 'Mark Boucher', 'Kumar Sangakkara'], correctAnswer: 'Kumar Sangakkara', explanation: 'Sri Lanka\'s Kumar Sangakkara holds the record for the most dismissals (catches and stumpings) by a wicket-keeper in ODI history.' },
    { format: 'odi', question: 'The 1996 Cricket World Cup was famously won by which underdog team?', options: ['Kenya', 'Zimbabwe', 'Sri Lanka', 'New Zealand'], correctAnswer: 'Sri Lanka', explanation: 'Sri Lanka, led by Arjuna Ranatunga, won the 1996 World Cup with an aggressive brand of cricket, defeating Australia in the final.' },
    { format: 'odi', question: 'Who holds the record for the fastest century in ODIs?', options: ['Shahid Afridi', 'Corey Anderson', 'AB de Villiers', 'Jos Buttler'], correctAnswer: 'AB de Villiers', explanation: 'AB de Villiers scored a century in just 31 balls against the West Indies in 2015, the fastest in ODI history.' },
    { format: 'odi', question: 'Which bowler was the first to take 400 wickets in ODIs?', options: ['Wasim Akram', 'Waqar Younis', 'Muttiah Muralitharan', 'Shaun Pollock'], correctAnswer: 'Wasim Akram', explanation: 'Pakistan\'s legendary left-arm fast bowler Wasim Akram was the first to reach the milestone of 400 ODI wickets.' },
    { format: 'odi', question: 'What is the record for the highest successful run chase in an ODI?', options: ['438/9 by South Africa', '418/5 by India', '389/4 by Australia', '372/6 by South Africa'], correctAnswer: '438/9 by South Africa', explanation: 'In a legendary 2006 match, South Africa successfully chased down Australia\'s total of 434, ending on 438/9.' },
    { format: 'odi', question: 'Who captained India to victory in the 2011 Cricket World Cup?', options: ['Sachin Tendulkar', 'Sourav Ganguly', 'MS Dhoni', 'Virat Kohli'], correctAnswer: 'MS Dhoni', explanation: 'MS Dhoni famously led India to their second World Cup title in 2011, hitting the winning six in the final against Sri Lanka.' },
    { format: 'odi', question: 'Which player has played the most ODI matches?', options: ['Ricky Ponting', 'Sanath Jayasuriya', 'Mahela Jayawardene', 'Sachin Tendulkar'], correctAnswer: 'Sachin Tendulkar', explanation: 'Sachin Tendulkar holds the record for the most appearances in ODIs, having played 463 matches for India.' },
    { format: 'odi', question: 'The first-ever day/night ODI match was played between which two countries?', options: ['England and West Indies', 'Australia and West Indies', 'India and Pakistan', 'Australia and England'], correctAnswer: 'Australia and West Indies', explanation: 'The first day/night One Day International was played in Sydney during the World Series Cricket on November 27, 1979.' },
    { format: 'odi', question: 'Which bowler has taken two hat-tricks in World Cup history?', options: ['Chetan Sharma', 'Saqlain Mushtaq', 'Brett Lee', 'Lasith Malinga'], correctAnswer: 'Lasith Malinga', explanation: 'Lasith Malinga of Sri Lanka is the only bowler to have taken two hat-tricks in Cricket World Cup tournaments.' },
    { format: 'odi', question: 'Who was the Man of the Tournament in the 1992 Cricket World Cup?', options: ['Wasim Akram', 'Imran Khan', 'Martin Crowe', 'Inzamam-ul-Haq'], correctAnswer: 'Martin Crowe', explanation: 'New Zealand\'s Martin Crowe was named Man of the Tournament for his innovative captaincy and brilliant batting in the 1992 World Cup.' },
    { format: 'odi', question: 'Which nation co-hosted the 1987 Cricket World Cup with India?', options: ['Sri Lanka', 'Bangladesh', 'Pakistan', 'UAE'], correctAnswer: 'Pakistan', explanation: 'The 1987 Reliance World Cup was the first to be held outside England, co-hosted by India and Pakistan.' },
    { format: 'odi', question: 'Who holds the record for the most sixes in an ODI innings?', options: ['Chris Gayle', 'Rohit Sharma', 'AB de Villiers', 'Eoin Morgan'], correctAnswer: 'Eoin Morgan', explanation: 'Eoin Morgan hit a record 17 sixes in his innings of 148 against Afghanistan during the 2019 World Cup.' },
    { format: 'odi', question: 'In which year were colored clothing and white balls introduced to the Cricket World Cup?', options: ['1987', '1992', '1996', '1999'], correctAnswer: '1992', explanation: 'The 1992 World Cup in Australia and New Zealand was the first to feature colored player clothing, white balls, and black sightscreens.' },
    { format: 'odi', question: 'Who is the youngest player to score a century in an ODI?', options: ['Sachin Tendulkar', 'Shahid Afridi', 'Tamim Iqbal', 'Usman Ghani'], correctAnswer: 'Shahid Afridi', explanation: 'Shahid Afridi scored a 37-ball century against Sri Lanka in 1996 at the age of 16 years and 217 days.' },
    { format: 'odi', question: 'What is the highest partnership in ODI cricket history?', options: ['Tendulkar/Dravid', 'Gayle/Samuels', 'Imam-ul-Haq/Fakhar Zaman', 'Campbell/Hope'], correctAnswer: 'Gayle/Samuels', explanation: 'Chris Gayle and Marlon Samuels put on a 372-run partnership for the second wicket against Zimbabwe in the 2015 World Cup.' },
    
    // ----- TEST (20) -----
    { format: 'test', question: 'Who took the first-ever 10-wicket haul in a single Test innings?', options: ['Sydney Barnes', 'Jim Laker', 'Anil Kumble', 'Hedley Verity'], correctAnswer: 'Jim Laker', explanation: 'England\'s Jim Laker was the first bowler to take all ten wickets in a Test innings, against Australia in 1956.' },
    { format: 'test', question: 'What is the term for a batsman being dismissed on the first ball they face?', options: ['Silver Duck', 'Golden Duck', 'Diamond Duck', 'Platinum Duck'], correctAnswer: 'Golden Duck', explanation: 'A golden duck is when a batsman is out on the very first delivery they face.' },
    { format: 'test', question: 'Which cricket ground is known as the "Home of Cricket"?', options: ['The Oval', 'Melbourne Cricket Ground', 'Eden Gardens', 'Lord\'s'], correctAnswer: 'Lord\'s', explanation: 'Lord\'s Cricket Ground in London is owned by the MCC and is famously referred to as the "Home of Cricket".' },
    { format: 'test', question: 'Who holds the record for the most Test match appearances?', options: ['Steve Waugh', 'Ricky Ponting', 'Sachin Tendulkar', 'James Anderson'], correctAnswer: 'Sachin Tendulkar', explanation: 'Sachin Tendulkar played a record 200 Test matches for India in his career.' },
    { format: 'test', question: 'What does it mean if a Test match ends in a "tie"?', options: ['The scores are level', 'The match is abandoned', 'Both teams are bowled out twice and the final scores are level', 'Rain stops play on Day 5'], correctAnswer: 'Both teams are bowled out twice and the final scores are level', explanation: 'A tie is an extremely rare result in Test cricket where the team batting last is bowled out with the scores exactly level.' },
    { format: 'test', question: 'Who was the first bowler to take 800 Test wickets?', options: ['Shane Warne', 'Anil Kumble', 'Glenn McGrath', 'Muttiah Muralitharan'], correctAnswer: 'Muttiah Muralitharan', explanation: 'Sri Lankan spinner Muttiah Muralitharan is the only bowler in history to have taken 800 Test wickets.' },
    { format: 'test', question: 'The famous "Bodyline" series took place between which two countries?', options: ['Australia and West Indies', 'England and Australia', 'India and Pakistan', 'South Africa and England'], correctAnswer: 'England and Australia', explanation: 'Bodyline was a controversial tactic used by the England team during the 1932–33 Ashes series in Australia.' },
    { format: 'test', question: 'What is the name of the cricket ball used in Test matches in England?', options: ['Kookaburra', 'SG', 'Dukes', 'Gray-Nicolls'], correctAnswer: 'Dukes', explanation: 'The Dukes ball, known for its prominent seam and ability to swing for longer, is used for Test matches in England and the West Indies.' },
    { format: 'test', question: 'Who has the most "not outs" in Test cricket history?', options: ['Shivnarine Chanderpaul', 'Steve Waugh', 'James Anderson', 'MS Dhoni'], correctAnswer: 'James Anderson', explanation: 'England fast bowler James Anderson holds the record for the most not-out innings in Test cricket, primarily due to batting down the order.' },
    { format: 'test', question: 'What is the record for the highest team total in a Test innings?', options: ['903/7d by England', '952/6d by Sri Lanka', '849 by England', '790/3d by West Indies'], correctAnswer: '952/6d by Sri Lanka', explanation: 'Sri Lanka scored a massive 952 for 6 declared against India in Colombo in 1997.' },
    { format: 'test', question: 'Who is the youngest player to score a century in Test cricket?', options: ['Sachin Tendulkar', 'Mohammad Ashraful', 'Mushtaq Mohammad', 'Hamilton Masakadza'], correctAnswer: 'Mohammad Ashraful', explanation: 'Mohammad Ashraful of Bangladesh became the youngest Test centurion at 17 years and 61 days old in 2001.' },
    { format: 'test', question: 'The "Ball of the Century" was bowled by Shane Warne to which batsman?', options: ['Sachin Tendulkar', 'Mike Gatting', 'Brian Lara', 'Graham Gooch'], correctAnswer: 'Mike Gatting', explanation: 'Shane Warne\'s first delivery in Ashes cricket in 1993 drifted and spun extravagantly to bowl England\'s Mike Gatting, becoming known as the "Ball of the Century".' },
    { format: 'test', question: 'Which player has captained their country in the most Test matches?', options: ['Ricky Ponting', 'Graeme Smith', 'Stephen Fleming', 'Allan Border'], correctAnswer: 'Graeme Smith', explanation: 'South Africa\'s Graeme Smith holds the record for captaining his side in the most Test matches.' },
    { format: 'test', question: 'A "nightwatchman" in Test cricket is typically a...', options: ['Senior batsman', 'Lower-order batsman sent in late in the day', 'Wicket-keeper', 'Specialist fielder'], correctAnswer: 'Lower-order batsman sent in late in the day', explanation: 'A nightwatchman is a tail-ender sent in to bat near the end of a day\'s play to protect a more valuable batsman from being dismissed.' },
    { format: 'test', question: 'Who was the second bowler, after Jim Laker, to take 10 wickets in a Test innings?', options: ['Richard Hadlee', 'Anil Kumble', 'Muttiah Muralitharan', 'Shane Warne'], correctAnswer: 'Anil Kumble', explanation: 'India\'s Anil Kumble achieved the rare feat of taking all 10 wickets in an innings against Pakistan in 1999.' },
    { format: 'test', question: 'What is a "pair" in cricket?', options: ['Two consecutive wickets by a bowler', 'A batsman scoring two runs', 'A batsman being dismissed for a duck in both innings', 'Two batsmen scoring centuries in the same innings'], correctAnswer: 'A batsman being dismissed for a duck in both innings', explanation: 'A batsman is said to have "bagged a pair" if they are dismissed for zero runs in both innings of a two-innings match.' },
    { format: 'test', question: 'The Benaud-Qadir Trophy is contested between which two Test nations?', options: ['Australia and Pakistan', 'Australia and India', 'England and Pakistan', 'New Zealand and Pakistan'], correctAnswer: 'Australia and Pakistan', explanation: 'The Benaud-Qadir Trophy is named after Australian legend Richie Benaud and Pakistani great Abdul Qadir.' },
    { format: 'test', question: 'What is the record for the most runs in a single day\'s play in a Test match?', options: ['494', '588', '643', '521'], correctAnswer: '588', explanation: 'An incredible 588 runs were scored on Day 2 of the Test between England and South Africa at Lord\'s in 1924.' },
    { format: 'test', question: 'Which wicket-keeper has the most dismissals in Test cricket history?', options: ['Adam Gilchrist', 'Ian Healy', 'MS Dhoni', 'Mark Boucher'], correctAnswer: 'Mark Boucher', explanation: 'South Africa\'s Mark Boucher holds the record for the most dismissals by a wicket-keeper in Test cricket.' },
    { format: 'test', question: 'Sir Donald Bradman famously finished his Test career with what batting average?', options: ['99.94', '100.00', '98.67', '95.14'], correctAnswer: '99.94', explanation: 'Requiring only four runs in his final innings to average 100, Don Bradman was famously bowled for a duck, finishing with an average of 99.94.' },
    
    // ----- WPL (20) -----
    { format: 'wpl', question: 'Which two teams competed in the first-ever WPL final?', options: ['Mumbai Indians and UP Warriorz', 'Delhi Capitals and Mumbai Indians', 'Royal Challengers Bangalore and Delhi Capitals', 'UP Warriorz and Gujarat Giants'], correctAnswer: 'Delhi Capitals and Mumbai Indians', explanation: 'Mumbai Indians defeated Delhi Capitals by 7 wickets in the final of the inaugural WPL season in 2023.' },
    { format: 'wpl', question: 'Who took the first-ever hat-trick in the WPL?', options: ['Sophie Ecclestone', 'Hayley Matthews', 'Issy Wong', 'Megan Schutt'], correctAnswer: 'Issy Wong', explanation: 'Issy Wong of Mumbai Indians claimed the first-ever WPL hat-trick against UP Warriorz.' },
    { format: 'wpl', question: 'Which stadium hosted the final of the inaugural WPL 2023?', options: ['DY Patil Stadium', 'Wankhede Stadium', 'Brabourne Stadium', 'Arun Jaitley Stadium'], correctAnswer: 'Brabourne Stadium', explanation: 'The Brabourne Stadium in Mumbai was the venue for the final of the 2023 Women\'s Premier League.' },
    { format: 'wpl', question: 'Which player was named the "Most Valuable Player" (MVP) of the inaugural WPL season?', options: ['Nat Sciver-Brunt', 'Meg Lanning', 'Hayley Matthews', 'Sophie Ecclestone'], correctAnswer: 'Hayley Matthews', explanation: 'Mumbai Indians\' all-rounder Hayley Matthews was awarded the MVP for her exceptional performance with both bat and ball.' },
    { format: 'wpl', question: 'How many overseas players are allowed in the playing XI of a WPL team?', options: ['3', '4', '5', '6'], correctAnswer: '5', explanation: 'A WPL team can field a maximum of five overseas players, provided at least one is from an ICC Associate Nation.' },
    { format: 'wpl', question: 'Which company was the title sponsor of the inaugural WPL season?', options: ['Dream11', 'Pepsi', 'Tata Group', 'Vivo'], correctAnswer: 'Tata Group', explanation: 'The Tata Group secured the title sponsorship rights for the first five years of the Women\'s Premier League.' },
    { format: 'wpl', question: 'Who was the captain of the Delhi Capitals team in WPL 2023?', options: ['Jemimah Rodrigues', 'Shafali Verma', 'Meg Lanning', 'Marizanne Kapp'], correctAnswer: 'Meg Lanning', explanation: 'Australian captain Meg Lanning led the Delhi Capitals to the final of the inaugural WPL season.' },
    { format: 'wpl', question: 'Which team finished at the bottom of the points table in WPL 2023?', options: ['UP Warriorz', 'Royal Challengers Bangalore', 'Gujarat Giants', 'Mumbai Indians'], correctAnswer: 'Gujarat Giants', explanation: 'Gujarat Giants, led by Beth Mooney and later Sneh Rana, finished last in the league stage of the 2023 WPL.' },
    { format: 'wpl', question: 'Who hit the first-ever six in WPL history?', options: ['Hayley Matthews', 'Harmanpreet Kaur', 'Yastika Bhatia', 'Smriti Mandhana'], correctAnswer: 'Hayley Matthews', explanation: 'Hayley Matthews of Mumbai Indians has the distinction of hitting the very first six in the history of the WPL.' },
    { format: 'wpl', question: 'Which player scored the fastest fifty in the inaugural WPL season?', options: ['Shafali Verma', 'Sophie Devine', 'Harmanpreet Kaur', 'Alice Capsey'], correctAnswer: 'Sophie Devine', explanation: 'RCB\'s Sophie Devine smashed a fifty off just 20 balls, which was the fastest of the 2023 WPL season.' },
    { format: 'wpl', question: 'Which WPL franchise is owned by the same group that owns the RCB men\'s team?', options: ['Delhi Capitals', 'Royal Challengers Bangalore', 'UP Warriorz', 'Gujarat Giants'], correctAnswer: 'Royal Challengers Bangalore', explanation: 'The Royal Challengers Bangalore WPL team is owned by Diageo, the same parent company as the men\'s IPL team.' },
    { format: 'wpl', question: 'Who was the head coach of the WPL 2023 winning team, Mumbai Indians?', options: ['Jhulan Goswami', 'Mithali Raj', 'Charlotte Edwards', 'Rachael Haynes'], correctAnswer: 'Charlotte Edwards', explanation: 'Former England captain Charlotte Edwards coached the Mumbai Indians to victory in the first WPL season.' },
    { format: 'wpl', question: 'The two venues for the WPL 2023 were Brabourne Stadium and which other stadium?', options: ['Wankhede Stadium', 'DY Patil Stadium', 'Pune Cricket Stadium', 'Eden Gardens'], correctAnswer: 'DY Patil Stadium', explanation: 'All matches of the WPL 2023 were held in Mumbai at the Brabourne Stadium and the DY Patil Stadium.' },
    { format: 'wpl', question: 'Who hit the highest individual score in the WPL 2023?', options: ['Alyssa Healy', 'Tahlia McGrath', 'Meg Lanning', 'Sophie Devine'], correctAnswer: 'Sophie Devine', explanation: 'Sophie Devine\'s explosive 99 for RCB against Gujarat Giants was the highest individual score of the WPL 2023.' },
    { format: 'wpl', question: 'Which team did UP Warriorz defeat in the eliminator to face Mumbai Indians?', options: ['They did not play Mumbai Indians', 'Royal Challengers Bangalore', 'Delhi Capitals', 'They lost the eliminator'], correctAnswer: 'They lost the eliminator', explanation: 'UP Warriorz lost the eliminator match to Mumbai Indians, who then went on to play Delhi Capitals in the final.' },
    { format: 'wpl', question: 'Which country had the most representatives among overseas players in the WPL 2023?', options: ['England', 'South Africa', 'Australia', 'New Zealand'], correctAnswer: 'Australia', explanation: 'Australian players were in high demand, with many of their World Cup-winning squad members playing key roles for WPL teams.' },
    { format: 'wpl', question: 'Who was the owner of the Gujarat Giants franchise in WPL 2023?', options: ['Reliance Industries', 'Adani Group', 'JSW Group', 'Capri Global'], correctAnswer: 'Adani Group', explanation: 'The Adani Group successfully bid for and owned the Ahmedabad-based franchise, named Gujarat Giants.' },
    { format: 'wpl', question: 'What was the official mascot for the WPL 2023?', options: ['Shera the Lion', 'Shakti the Tigress', 'Dhakad the Bull', 'Appu the Elephant'], correctAnswer: 'Shakti the Tigress', explanation: 'The official mascot for the inaugural Women\'s Premier League was a tigress named Shakti.' },
    { format: 'wpl', question: 'Who bowled the first ball in WPL history?', options: ['Renuka Singh Thakur', 'Ashleigh Gardner', 'Megan Schutt', 'Nat Sciver-Brunt'], correctAnswer: 'Ashleigh Gardner', explanation: 'Gujarat Giants\' off-spinner Ashleigh Gardner bowled the first-ever delivery in the history of the WPL to Yastika Bhatia.' },
    { format: 'wpl', question: 'Which player hit the winning runs for Mumbai Indians in the WPL 2023 final?', options: ['Harmanpreet Kaur', 'Amelia Kerr', 'Pooja Vastrakar', 'Nat Sciver-Brunt'], correctAnswer: 'Nat Sciver-Brunt', explanation: 'Nat Sciver-Brunt scored the winning runs and remained not out to guide Mumbai Indians to victory in the final.' }
];

/**
 * A one-time function to seed the fallback questions into Firestore.
 * This should be executed from a trusted server environment or a secure admin panel.
 * It is idempotent, meaning it won't create duplicate questions if run multiple times.
 */
export async function seedFallbackQuestions() {
    if (!db) {
        console.error("Firestore DB is not initialized. Cannot seed questions.");
        return { success: false, error: "Firestore not initialized." };
    }

    const { writeBatch, collection, doc } = await import('firebase/firestore');
    
    console.log(`Starting to seed ${allFallbackQuestions.length} fallback questions...`);
    const batch = writeBatch(db);
    const questionsCollection = collection(db, 'fallback_questions');
    let count = 0;

    for (const q of allFallbackQuestions) {
        // Create a simple, consistent ID based on the question text
        const docId = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
        const docRef = doc(questionsCollection, docId);
        
        const questionData: QuizQuestion = {
            id: docId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
        };

        // Use 'set' with merge:true to be idempotent. It creates or overwrites.
        batch.set(docRef, { ...questionData, format: q.format.toLowerCase() }, { merge: true });
        count++;
    }

    try {
        await batch.commit();
        console.log(`Successfully seeded ${count} questions into 'fallback_questions' collection.`);
        return { success: true, count };
    } catch (error) {
        console.error("Error seeding fallback questions:", error);
        return { success: false, error };
    }
}
