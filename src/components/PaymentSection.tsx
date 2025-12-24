import { Bitcoin, Wallet, CreditCard, Building } from 'lucide-react';

interface PaymentSectionProps {
  onLoginClick: () => void;
}

const paymentMethods = [
  {
    icon: Bitcoin,
    name: 'Bitcoin',
    desc: 'Fast & secure crypto payments',
    color: '#F7931A',
  },
  {
    icon: Wallet,
    name: 'Bkash',
    desc: 'Instant mobile banking',
    color: '#28C76F',
  },
  {
    icon: CreditCard,
    name: 'PayPal',
    desc: 'Global payment solution',
    color: '#0070BA',
  },
  {
    icon: Building,
    name: 'Bank Transfer',
    desc: 'Direct to your account',
    color: '#667EEA',
  },
];

const PaymentSection = ({ onLoginClick }: PaymentSectionProps) => {
  return (
    <section className="py-16 px-4 md:px-[5%] text-center bg-background/70 mt-10">
      <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4 text-gradient">
        Secure Payment Methods
      </h2>
      <p className="text-base md:text-lg opacity-80 mb-10 max-w-xl mx-auto">
        Get paid instantly through multiple secure payment options. Choose your preferred method and start earning today!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {paymentMethods.map((method) => (
          <div
            key={method.name}
            onClick={onLoginClick}
            className="glass-card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 group"
          >
            <div className="text-5xl mb-4 h-16 flex items-center justify-center">
              <method.icon className="w-12 h-12 transition-transform group-hover:scale-110" style={{ color: method.color }} />
            </div>
            <div className="text-lg font-bold mb-2">{method.name}</div>
            <div className="text-sm opacity-80">{method.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PaymentSection;
