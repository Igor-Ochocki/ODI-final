import Link from "next/link";
import { Send, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import SentMessageRow from "./SentMessageRow";

interface Message {
  id: string;
  subject_encrypted: string;
  encrypted_key: string;
  has_attachments: boolean;
  attachments_count: number;
  recipients_count: number;
  created_at: string;
  is_read: boolean;
}

interface SentMessageListProps {
  messages: Message[];
  decryptedSubjects: Map<string, string>;
  isLoading: boolean;
  error: string;
  page: number;
  totalPages: number;
  total: number;
  formatDate: (dateStr: string) => string;
  onPageChange: (page: number) => void;
}

export default function SentMessageList({
  messages,
  decryptedSubjects,
  isLoading,
  error,
  page,
  totalPages,
  total,
  formatDate,
  onPageChange,
}: SentMessageListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="w-12 h-12 mx-auto mb-4 text-dark-600" />
        <p className="text-dark-400">You haven't sent any messages yet</p>
        <Link href="/messages/compose" className="btn-primary mt-4 inline-block">
          Write your first message
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {messages.map((message) => (
          <SentMessageRow
            key={message.id}
            message={message}
            decryptedSubject={decryptedSubjects.get(message.id)}
            formatDate={formatDate}
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
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 text-dark-400 hover:text-primary-400 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-dark-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 text-dark-400 hover:text-primary-400 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
