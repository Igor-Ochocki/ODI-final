import { Send, Loader2 } from "lucide-react";

interface ComposeHeaderProps {
  isSending: boolean;
  canSend: boolean;
  onSend: () => void;
}

export default function ComposeHeader({ isSending, canSend, onSend }: ComposeHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-mono">New message</h1>
        <button
          onClick={onSend}
          disabled={isSending || !canSend}
          className="btn-primary flex items-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>
    </header>
  );
}
