interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background flex justify-center items-center z-[9999] flex-col">
      <div className="text-center">
        <div className="text-2xl font-display font-black mb-3 text-gradient">
          BILLUCASH
        </div>
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin-slow mx-auto mb-2" />
        <div className="text-muted-foreground text-[10px]">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
