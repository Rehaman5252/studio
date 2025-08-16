
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
          <AccordionTrigger>Privacy Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert">
            <p>Your privacy is important to us. It is CricBlitz's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
            <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
            <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Terms of Service</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert">
            <p>By accessing the app CricBlitz, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on CricBlitz's app for personal, non-commercial transitory viewing only.</p>
            <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by CricBlitz at any time.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Fair Play Policy</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert">
            <p>CricBlitz is committed to ensuring Fair Play. We have a zero-tolerance policy towards any user engaging in malpractice, which includes using bots, multiple accounts, or any form of cheating to gain an unfair advantage.</p>
            <p>Any user found to be in violation of our Fair Play Policy will be subject to penalties, including but not limited to, forfeiture of winnings, temporary suspension, or permanent account termination.</p>
            <p>Our "No-Ball" system tracks suspicious activity. Accumulating three "No-Balls" in a single day will result in a temporary ban from playing quizzes.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
}
