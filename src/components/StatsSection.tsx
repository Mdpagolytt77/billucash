import { Users, CheckCircle, Clock, DollarSign } from 'lucide-react';

const stats = [
  { icon: DollarSign, value: '$30,000+', label: 'Total Paid Yet', color: '#1DBF73' },
  { icon: Users, value: '680,000+', label: 'Total Users Joined', color: '#1DBF73' },
  { icon: Clock, value: '18m 30s', label: 'Average time for first cashout', color: '#1DBF73' },
  { icon: CheckCircle, value: '$20+', label: 'Average Daily User Earn', color: '#1DBF73' },
];

const StatsSection = () => {
  return (
    <section className="py-10 px-4">
      <div 
        className="rounded-2xl p-6 md:p-8 max-w-4xl mx-auto"
        style={{ background: '#0E1625', border: '1px solid rgba(29,191,115,0.1)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              <div className="text-xl md:text-2xl font-display font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
