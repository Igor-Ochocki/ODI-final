import { Message } from "@/types/interfaces";
import { Lock, Paperclip, Users } from "lucide-react";
import Link from "next/link";

export default function MessageRow({
  message,
  isSelected,
  onSelect,
  formatDate,
  decryptedSubject,
}: {
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  formatDate: (date: string) => string;
  decryptedSubject?: string;
}) {
  const displaySubject = decryptedSubject || "(Encrypted message)";
  const isEncrypted = !decryptedSubject;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-sm transition-colors cursor-pointer group ${
        message.is_read
          ? "bg-dark-900/30 hover:bg-dark-800/50"
          : "bg-dark-800/50 hover:bg-dark-700/50"
      } ${isSelected ? "ring-1 ring-primary-500/50" : ""}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-800"
      />

      <Link href={`/messages/${message.id}`} className="flex-1 flex items-center gap-3 min-w-0">
        {!message.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}

        <div className="w-32 flex-shrink-0">
          <p
            className={`text-sm truncate ${message.is_read ? "text-dark-400" : "text-dark-200 font-medium"}`}
          >
            {message.sender?.username || "Usunięty użytkownik"}
          </p>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          {isEncrypted && <Lock className="w-3 h-3 text-dark-500 flex-shrink-0" />}
          <p
            className={`text-sm truncate ${message.is_read ? "text-dark-400" : "text-dark-200"} ${isEncrypted ? "italic" : ""}`}
          >
            {displaySubject}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {message.has_attachments && (
            <span title={`${message.attachments_count} załącznik(i)`}>
              <Paperclip className="w-4 h-4 text-dark-500" />
            </span>
          )}
          {message.recipients_count > 1 && (
            <div
              className="flex items-center gap-1 text-dark-500"
              title={`To ${message.recipients_count} recipients`}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">{message.recipients_count}</span>
            </div>
          )}
        </div>

        <div className="w-20 text-right flex-shrink-0">
          <span className={`text-xs ${message.is_read ? "text-dark-500" : "text-dark-400"}`}>
            {formatDate(message.created_at)}
          </span>
        </div>
      </Link>
    </div>
  );
}
