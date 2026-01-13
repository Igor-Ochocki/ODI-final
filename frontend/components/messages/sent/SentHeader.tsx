import { RefreshCw } from "lucide-react";

interface SentHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export default function SentHeader({ isLoading, onRefresh }: SentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-mono">Sent</h1>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
