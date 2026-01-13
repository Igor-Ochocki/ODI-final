import { ArrowLeft } from "lucide-react";

interface MessageDetailHeaderProps {
  subject: string;
  onBack: () => void;
}

export default function MessageDetailHeader({ subject, onBack }: MessageDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
      <div className="px-4 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-dark-800 rounded-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-mono truncate flex-1">
          {subject || "[Encrypted message]"}
        </h1>
      </div>
    </header>
  );
}
