import { Message } from "@/types/interfaces";
import { MailOpen, RefreshCw, Trash2 } from "lucide-react";

interface HeaderProps {
  isLoading: boolean;
  unreadOnly: boolean;
  selectedIds: Set<string>;
  messages: Message[];
  setUnreadOnly: (unread: boolean) => void;
  setPage: (page: number) => void;
  fetchMessages: () => Promise<void>;
  handleSelectAll: () => void;
  handleMarkRead: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

export default function Header({
  isLoading,
  unreadOnly,
  selectedIds,
  messages,
  setUnreadOnly,
  setPage,
  fetchMessages,
  handleSelectAll,
  handleMarkRead,
  handleDelete,
}: HeaderProps) {
  return (
    <header className="sticky top-0 md:top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold font-mono">Odebrane</h1>
          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
            title="Odśwież"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === messages.length && messages.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-800"
            />
            <span className="text-dark-400">Zaznacz wszystkie</span>
          </label>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-dark-300 hover:text-primary-400 transition-colors"
              >
                <MailOpen className="w-4 h-4" />
                Oznacz jako przeczytane
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-dark-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Usuń
              </button>
            </>
          )}

          <label className="flex items-center gap-2 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-800"
            />
            <span className="text-dark-400">Tylko nieprzeczytane</span>
          </label>
        </div>
      </div>
    </header>
  );
}
