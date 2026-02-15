import { MessageCircle } from 'lucide-react';

const FloatingChatButton = () => {
  return (
    <button
      onClick={() => window.open('#', '_blank')}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex items-center gap-1.5 px-2 py-3 bg-gradient-to-b from-green-500 to-emerald-600 text-white rounded-l-xl shadow-lg shadow-green-500/30 hover:pr-4 transition-all duration-300 group"
      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
    >
      <MessageCircle className="w-4 h-4 rotate-90" />
      <span className="text-xs font-semibold tracking-wider">Chat with us</span>
    </button>
  );
};

export default FloatingChatButton;
