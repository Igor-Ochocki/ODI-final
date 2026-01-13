import { Message } from "@/types/interfaces";
import { AlertCircle, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import MessageRow from "./MessageRow";
import { Dispatch, SetStateAction } from "react";

interface InboxProps {
  error: string;
  isLoading: boolean;
  messages: Message[];
  unreadOnly: boolean;
  selectedIds: Set<string>;
  handleSelect: (id: string) => void;
  decryptedSubjects: Map<string, string>;
  totalPages: number;
  total: number;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function Inbox({
  error,
  isLoading,
  messages,
  unreadOnly,
  selectedIds,
  handleSelect,
  decryptedSubjects,
  totalPages,
  total,
  page,
  setPage,
}: InboxProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Wczoraj";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("pl-PL", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    }
  };
  return (
    <div className="px-4 py-4">
      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400">{unreadOnly ? "No unread messages" : "Inbox is empty"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                isSelected={selectedIds.has(message.id)}
                onSelect={() => handleSelect(message.id)}
                formatDate={formatDate}
                decryptedSubject={decryptedSubjects.get(message.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-800">
              <p className="text-sm text-dark-400">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-dark-400 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-dark-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-dark-400 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
