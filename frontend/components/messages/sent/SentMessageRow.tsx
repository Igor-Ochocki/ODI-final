import Link from "next/link";
import { Send, Paperclip, Users, Lock } from "lucide-react";

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

interface SentMessageRowProps {
  message: Message;
  decryptedSubject?: string;
  formatDate: (dateStr: string) => string;
}

export default function SentMessageRow({
  message,
  decryptedSubject,
  formatDate,
}: SentMessageRowProps) {
  const isEncrypted = !decryptedSubject;
  const displaySubject = decryptedSubject || "(Encrypted message)";

  return (
    <Link
      href={`/messages/${message.id}`}
      className="flex items-center gap-3 p-3 rounded-sm bg-dark-900/30 hover:bg-dark-800/50 transition-colors group"
    >
      <Send className="w-4 h-4 text-dark-500 flex-shrink-0" />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isEncrypted && <Lock className="w-3 h-3 text-dark-500 flex-shrink-0" />}
        <p className={`text-sm text-dark-400 truncate ${isEncrypted ? "italic" : ""}`}>
          {displaySubject}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {message.has_attachments && <Paperclip className="w-4 h-4 text-dark-500" />}
        {message.recipients_count > 0 && (
          <div className="flex items-center gap-1 text-dark-500">
            <Users className="w-4 h-4" />
            <span className="text-xs">{message.recipients_count}</span>
          </div>
        )}
      </div>

      <div className="w-20 text-right flex-shrink-0">
        <span className="text-xs text-dark-500">{formatDate(message.created_at)}</span>
      </div>
    </Link>
  );
}
