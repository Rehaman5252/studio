
'use client';
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
            <p>indcric is dedicated to providing a premier skill-based cricket trivia platform that is engaging, rewarding, and operates with the utmost integrity. Our mission is to celebrate the passion for cricket by offering a fair, transparent, and secure environment for our users to test their knowledge and win rewards.</p>
            <h4>Responsible Participation</h4>
            <p>We are committed to promoting responsible participation. Users must be 18 years of age or older. We encourage users to participate for entertainment and skill enhancement. Please play responsibly and within your means. This is a game of skill and should not be considered a source of regular income.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Fair Play & Anti-Malpractice Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>indcric maintains a strict zero-tolerance policy against any form of malpractice. This is a platform for individual skill, and any attempt to undermine the integrity of the game is a material breach of these terms.</p>
            <ul>
                <li><strong>Prohibited Actions:</strong> Malpractice includes, but is not limited to, the use of multiple accounts, bots, automated scripts, screen sharing, minimizing the app or switching tabs during a live quiz, colluding with other players, or exploiting any bugs or loopholes.</li>
                <li><strong>"No-Ball" System:</strong> We employ automated and manual systems to detect malpractice. Actions like switching tabs during a quiz will result in a "No-Ball" warning. Accumulating three (3) "No-Balls" within a 24-hour period will lead to a temporary suspension from gameplay for that day.</li>
                <li><strong>Consequences:</strong> Any user found engaging in malpractice, as determined by indcric in its sole discretion, will face penalties including, but not limited to, immediate disqualification from quizzes, forfeiture of all winnings and account balance, and permanent suspension or termination of their account.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Payout Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>Our payout process is designed to be transparent and compliant with applicable Indian financial regulations.</p>
            <ul>
                <li><strong>Eligibility:</strong> Users must have a verified account, including a valid UPI ID, and be in full compliance with our terms to be eligible for payouts.</li>
                <li><strong>Process:</strong> Winnings from perfect scores are credited to the user's indcric account. Withdrawals can be initiated once the user meets the minimum withdrawal threshold, as specified on the platform.</li>
                <li><strong>Taxation:</strong> All winnings are subject to taxation as per the laws of India, including Tax Deducted at Source (TDS) where applicable. It is the user's responsibility to comply with their personal tax obligations.</li>
                <li><strong>Verification:</strong> We reserve the right to request additional KYC (Know Your Customer) documentation to verify identity and prevent fraud before processing payouts, in accordance with Indian anti-money laundering (AML) regulations.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>Referral Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
             <p>Users can earn referral bonuses by inviting new users to the platform.</p>
             <ul>
                <li><strong>Earning a Bonus:</strong> A referral bonus is credited to the referrer only after the referred user successfully signs up, completes their first quiz with a perfect score, and is not disqualified for any reason.</li>
                <li><strong>Fair Use:</strong> The creation of fake accounts or any other method to abuse the referral system is strictly prohibited and will result in the forfeiture of all referral bonuses and potential account suspension.</li>
                <li><strong>Policy Changes:</strong> The terms and bonus amounts of the referral program are subject to change at indcric's discretion.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger>Daily Streak Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>The Daily Streak rewards consistent participation on the indcric platform.</p>
             <ul>
                <li><strong>Maintaining a Streak:</strong> A user must play at least one full quiz each calendar day (00:00 to 23:59 IST) to maintain their streak.</li>
                <li><strong>Streak Logic:</strong> The streak increases by one if a quiz was played on the previous consecutive day. If a day is missed, the streak resets to zero.</li>
                <li><strong>Rewards:</strong> Milestone rewards are granted for reaching specific streak lengths. These rewards are non-transferable and subject to the terms of the specific reward. indcric reserves the right to modify the streak milestones and rewards at any time.</li>
            </ul>
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
              <p>Users can earn rewards, such as Gift Vouchers, by meeting specific contribution quotas. A reward is only unlocked after the required number of submissions for each content type (facts, posts, questions) has been successfully verified and approved by our moderators. indcric reserves the right to change the reward structure and quotas at any time.</p>
            </AccordionContent>
        </AccordionItem>
         <AccordionItem value="item-6">
          <AccordionTrigger>Privacy Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>Your privacy is paramount. This policy outlines our practices concerning the collection, use, and protection of your personal information, in compliance with the Digital Personal Data Protection Act (DPDPA) and other applicable Indian laws.</p>
            <ul>
                <li><strong>Information We Collect:</strong> We collect information you provide during registration (name, email, phone, etc.), gameplay data, and device information for security and analytics.</li>
                <li><strong>Use of Information:</strong> Your data is used to operate the platform, process payouts, prevent fraud, and enhance user experience. We do not sell or rent your personal data to third parties.</li>
                <li><strong>Data Security:</strong> We implement robust technical and organizational security measures to protect your data from unauthorized access, loss, or misuse.</li>
                <li><strong>Your Rights:</strong> You have the right to access, correct, or request the deletion of your personal data, subject to legal and operational retention requirements.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-7">
          <AccordionTrigger>Cookie Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert max-w-none">
            <p>indcric uses cookies and similar tracking technologies to ensure our platform functions correctly and to improve your user experience.</p>
            <ul>
                <li><strong>What are Cookies:</strong> Cookies are small text files stored on your device that help us remember your preferences, secure your account, and analyze platform performance.</li>
                <li><strong>Types of Cookies Used:</strong> We use essential cookies for security and site functionality (e.g., keeping you logged in) and analytics cookies to understand how our platform is used.</li>
                <li><strong>Your Choices:</strong> While essential cookies are necessary for the platform to work, you may be able to control analytics cookies through your browser settings. Disabling essential cookies may impact your ability to use indcric.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
}
