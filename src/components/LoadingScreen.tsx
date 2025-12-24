interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background flex justify-center items-center z-[9999] flex-col">
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-display font-black mb-5 text-gradient">
          BILLUCASH
        </div>
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin-slow mx-auto mb-4" />
        <div className="text-muted-foreground text-sm">
          Loading Premium Experience...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
