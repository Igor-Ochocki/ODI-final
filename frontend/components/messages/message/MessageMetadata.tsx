import { User, Clock, Users, Lock } from "lucide-react";
import { MessageDetail } from "@/types/interfaces";

interface MessageMetadataProps {
  message: MessageDetail;
  isSender: boolean;
  decryptedBody: string;
  onVerify: () => void;
  formatDate: (dateStr: string) => string;
}

export default function MessageMetadata({
  message,
  isSender,
  decryptedBody,
  onVerify,
  formatDate,
}: MessageMetadataProps) {
  return (
    <div className="card-cyber p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-dark-200">
              {message.sender?.username || "Unknown sender"}
            </span>
            {isSender && (
              <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-dark-500">{message.sender?.email || "No email"}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-dark-500">
          <Clock className="w-4 h-4" />
          {formatDate(message.created_at)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm text-dark-400">
        <Users className="w-4 h-4" />
        <span>To: </span>
        <span className="text-dark-300">
          {message.recipients.map((r) => r.recipient_username).join(", ")}
        </span>
      </div>

      <div className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/30 rounded-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-400" />
          <span className="text-sm text-primary-300">This message is end-to-end encrypted</span>
        </div>
        {decryptedBody && (
          <button
            onClick={onVerify}
            className="text-xs px-2 py-1 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 rounded text-primary-400 transition-colors"
          >
            Verify
          </button>
        )}
      </div>
    </div>
  );
}
