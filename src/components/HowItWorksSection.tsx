import { UserPlus, ListTodo, Wallet } from 'lucide-react';
import howItWorksIllustration from '@/assets/how-it-works-illustration.png';

const steps = [
  {
    icon: UserPlus,
    title: 'Join In',
    description: 'Create your free account to start earning',
    color: 'bg-primary/20 text-primary',
  },
  {
    icon: ListTodo,
    title: 'Select Task',
    description: 'Select Task and complete them quickly.',
    color: 'bg-primary/20 text-primary',
  },
  {
    icon: Wallet,
    title: 'Withdraw',
    description: 'Get paid fast and securely',
    color: 'bg-primary/20 text-primary',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-10 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
          Your simple path to extra income
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Complete easy tasks in your spare time and start earning today. Join WallsCash and turn every moment into a rewarding opportunity
        </p>
      </div>

      {/* 3D Illustration */}
      <div className="flex justify-center mb-8">
        <img 
          src={howItWorksIllustration} 
          alt="How it works" 
          className="w-full max-w-2xl h-auto object-contain drop-shadow-lg"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-muted rounded-xl p-6 text-center transition-transform hover:-translate-y-1 cursor-pointer"
          >
            <div className={`w-16 h-16 ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              <step.icon className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
