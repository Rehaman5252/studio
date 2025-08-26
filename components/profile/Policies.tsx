
"use client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  
export default function Policies() {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Platform Mission & Responsible Participation</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <h4>Our Mission</h4>
            <p>indcric is dedicated to providing a premier knowledge-based cricket trivia platform. Our mission is to celebrate the passion for cricket by offering a fair, transparent, and secure environment for our users to test and enhance their knowledge of the sport.</p>
            <h4>User Acknowledgment & Responsible Conduct</h4>
            <p>By participating on this platform, you expressly acknowledge and agree that indcric is designed exclusively for the purpose of testing and improving one's knowledge of cricket. It is not intended for entertainment, financial gain, or as a game of chance or gambling. We expect all users to participate responsibly. Users must be 18 years of age or older. </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Legal Framework and Compliance</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <h4>Adherence to Indian Law</h4>
            <p>indcric operates in strict compliance with the laws of India. The platform's activities are structured to align with the principles laid down by the Supreme Court of India, which distinguishes between games of chance and competitions of knowledge. Our quizzes are designed as competitions where success depends on a user's pre-existing knowledge of cricket.</p>
            <h4>Non-Applicability of Gambling Laws</h4>
            <p>The Public Gambling Act, 1867, and various state enactments prohibit games of chance. Our platform, being based on knowledge, does not fall within the definition of gambling. We do not engage in any activity that could be construed as betting or wagering, as defined under applicable laws.</p>
             <h4>Compliance with IT Rules</h4>
            <p>We adhere to the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and its amendments, operating as a permissible online platform and not an online real-money game that involves wagering on outcomes.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Fair Play & Anti-Malpractice Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>indcric maintains a strict zero-tolerance policy against any form of malpractice to ensure the integrity of our knowledge-based quizzes. Any attempt to undermine the fairness of the platform is a material breach of these terms.</p>
            <ul>
                <li><strong>Prohibited Actions:</strong> Malpractice includes, but is not limited to, the use of multiple accounts, bots, automated scripts, screen sharing, minimizing the app or switching tabs during a live quiz, colluding with other players, or exploiting any bugs or loopholes.</li>
                <li><strong>"No-Ball" System:</strong> We employ automated and manual systems to detect such actions. Activities like switching tabs during a quiz will result in a "No-Ball" warning. Accumulating three (3) "No-Balls" within a 24-hour period will lead to a temporary suspension from gameplay for that day.</li>
                <li><strong>Consequences of Violation:</strong> Any user found engaging in malpractice, as determined by indcric in its sole discretion, will face penalties including, but not limited to, immediate disqualification from quizzes, forfeiture of all prizes, and permanent suspension of their account.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>Prizes & Payout Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>Prizes on indcric are granted as a recognition of a user's superior knowledge, demonstrated by achieving a perfect score in a quiz.</p>
            <ul>
                <li><strong>Nature of Prizes:</strong> Prizes are not "winnings" from a wager, but are awards for demonstrating exceptional knowledge.</li>
                <li><strong>Eligibility:</strong> Users must have a verified account, including a valid UPI ID, and be in full compliance with our terms to be eligible for prizes.</li>
                <li><strong>Taxation:</strong> All prizes are subject to taxation as per the laws of India, including Tax Deducted at Source (TDS) under Section 194BA of the Income Tax Act, 1961, where applicable. It is the user's responsibility to comply with their personal tax obligations.</li>
                <li><strong>Verification:</strong> We reserve the right to request additional KYC (Know Your Customer) documentation to verify identity and prevent fraud before processing prizes, in accordance with applicable regulations.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
            <AccordionTrigger>Platform Mechanics Explained</AccordionTrigger>
            <AccordionContent className="prose dark:prose-invert max-w-none">
                <h4>Daily Streaks</h4>
                <p>Users can build a "Daily Streak" by playing at least one quiz every day (based on the UTC calendar). The streak increases by one for each consecutive day of play. Missing a day will reset the streak to zero. Reaching certain streak milestones may unlock badges or other non-monetary acknowledgments on the platform.</p>
                <h4>Referral Program</h4>
                <p>Users can invite friends using a unique referral code. A successful referral occurs when a new user signs up with the code and completes their first perfect-score quiz. The referring user will then receive a referral bonus as a prize. The terms and amount of the referral bonus are subject to change.</p>
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-8">
            <AccordionTrigger>Commentary Box &amp; User Contributions</AccordionTrigger>
            <AccordionContent className="prose dark:prose-invert max-w-none">
              <h4>Content Submission</h4>
              <p>The "Commentary Box" feature allows users to contribute original cricket-related content, including facts, posts, and quiz questions, to the indcric community.</p>
              <h4>Verification Process</h4>
              <p>All user-submitted content is subject to review and verification by our moderation team. Content will not be published on the platform until it has been approved. You can view the status of your submissions (e.g., "Under Verification", "Verified", "Rejected") in your contribution history.</p>
              <h4>Content Guidelines</h4>
              <ul>
                <li><strong>Originality:</strong> All submissions must be your own original work. Plagiarism or submitting content copied from other sources is strictly prohibited.</li>
                <li><strong>Accuracy:</strong> Facts and quiz questions must be accurate and verifiable.</li>
                <li><strong>Appropriateness:</strong> Content must not be offensive, abusive, defamatory, or contain any inappropriate material.</li>
              </ul>
              <h4>Content Rights &amp; Usage</h4>
              <p>By submitting content, you grant indcric a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, and display the content on our platform and in our marketing materials. You will be credited for your contribution where appropriate.</p>
              <h4>Contribution Rewards</h4>
              <p>Users can earn non-monetary rewards, such as Gift Vouchers, by meeting specific contribution quotas. A reward is only unlocked after the required number of submissions for each content type (facts, posts, questions) has been successfully verified and approved by our moderators. indcric reserves the right to change the reward structure and quotas at any time.</p>
            </AccordionContent>
        </AccordionItem>
         <AccordionItem value="item-6">
          <AccordionTrigger>Privacy Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>Your privacy is paramount. This policy outlines our practices concerning the collection, use, and protection of your personal information, in compliance with the Digital Personal Data Protection Act (DPDPA), 2023 and other applicable Indian laws.</p>
            <ul>
                <li><strong>Information We Collect:</strong> We collect information you provide during registration (name, email, phone, etc.), gameplay data, and device information for security and analytics.</li>
                <li><strong>Use of Information:</strong> Your data is used to operate the platform, process prizes, prevent fraud, and enhance user experience. We do not sell or rent your personal data to third parties.</li>
                <li><strong>Data Security:</strong> We implement robust technical and organizational security measures to protect your data from unauthorized access, loss, or misuse.</li>
                <li><strong>Your Rights:</strong> You have the right to access, correct, or request the deletion of your personal data, subject to legal and operational retention requirements.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
}
