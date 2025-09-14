import { Sparkles } from "lucide-react";

function AiConversationAvatar({className}: {className?: string}) {
  return (
    <div className={`relative w-14 h-14 flex items-center justify-center rounded-full overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 
        bg-[length:200%_200%] animate-gradientMove z-10"
      />
      <div className="absolute inset-0 rounded-full z-0">
        <div className="w-full h-full rounded-full bg-purple-500 opacity-40 blur-2xl animate-pulse" />
      </div>
      <Sparkles className="relative z-20 h-6 w-6 text-white" />
    </div>
  );
}

export default AiConversationAvatar;
