import { forwardRef } from 'react';
import { Snowflake } from 'lucide-react';

interface SnowToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const SnowToggle = forwardRef<HTMLButtonElement, SnowToggleProps>(
  ({ enabled, onToggle }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          enabled 
            ? 'bg-primary/20 text-primary border border-primary/30' 
            : 'bg-muted text-muted-foreground border border-border'
        }`}
        title={enabled ? 'Disable Snow' : 'Enable Snow'}
      >
        <Snowflake className="w-4 h-4" />
      </button>
    );
  }
);

SnowToggle.displayName = 'SnowToggle';

export default SnowToggle;
