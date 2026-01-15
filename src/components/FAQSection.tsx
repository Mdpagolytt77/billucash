import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const tabs = ['General', 'Earn', 'Withdraw', 'Account', 'Policies'];

const faqData: Record<string, { question: string; answer: string }[]> = {
  General: [
    {
      question: 'Are surveys reliable?',
      answer: 'All surveys on WallsCash are secure. Any information you provide in the surveys is kept anonymous, and the survey providers implement numerous measures to guarantee the safety of the surveys. We do not have access to the details you enter, as only the survey administrators can view and manage this information.',
    },
    {
      question: 'What steps do I need to take to begin?',
      answer: 'Simply create a free account, complete the verification process, and start completing tasks to earn rewards.',
    },
    {
      question: 'What exactly are coins?',
      answer: 'Coins are the virtual currency used on our platform. You earn coins by completing tasks, and you can convert them to real money when you withdraw.',
    },
    {
      question: 'What are the rules for chat?',
      answer: 'Be respectful to other users, no spam or advertising, and follow our community guidelines.',
    },
    {
      question: 'What is WallsCash all about?',
      answer: 'WallsCash is a rewards platform where you can earn money by completing surveys, watching videos, playing games, and referring friends.',
    },
    {
      question: 'Who manages the offer/survey walls displayed?',
      answer: 'We partner with trusted third-party providers who manage the offers and surveys displayed on our platform.',
    },
  ],
  Earn: [
    {
      question: 'How can I earn coins?',
      answer: 'You can earn coins by completing surveys, watching videos, playing games, downloading apps, and referring friends.',
    },
    {
      question: 'How much can I earn?',
      answer: 'Your earnings depend on your activity level. Active users can earn significant rewards by completing multiple tasks daily.',
    },
  ],
  Withdraw: [
    {
      question: 'How do I withdraw my earnings?',
      answer: 'Go to the Withdraw section, select your preferred payment method, enter the amount, and submit your request.',
    },
    {
      question: 'What is the minimum withdrawal amount?',
      answer: 'The minimum withdrawal amount varies by payment method. Check the Withdraw page for specific limits.',
    },
  ],
  Account: [
    {
      question: 'How do I change my password?',
      answer: 'Go to Profile Settings and use the password change option to update your password.',
    },
    {
      question: 'Can I have multiple accounts?',
      answer: 'No, each user is allowed only one account. Multiple accounts will result in a ban.',
    },
  ],
  Policies: [
    {
      question: 'What is your privacy policy?',
      answer: 'We take your privacy seriously. Your personal information is encrypted and never shared with third parties without your consent.',
    },
    {
      question: 'What are the terms of service?',
      answer: 'By using our platform, you agree to follow our community guidelines, not engage in fraudulent activity, and respect other users.',
    },
  ],
};

const FAQSection = () => {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <section className="py-10 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
          Your WallsCash questions answered
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Here are some frequently asked questions to help you if you are unsure about something, or if you have any questions about how to earn money on WallsCash.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* FAQ Accordion */}
      <div className="max-w-2xl mx-auto bg-muted rounded-2xl overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {faqData[activeTab]?.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-0">
              <AccordionTrigger className="px-4 py-4 text-left text-sm hover:no-underline hover:bg-muted/50">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
