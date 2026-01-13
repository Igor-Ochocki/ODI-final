import { Paperclip, FileDown, Loader2 } from "lucide-react";
import { MessageDetail } from "@/types/interfaces";

interface MessageAttachmentsProps {
  message: MessageDetail;
  decryptedAttachments: Map<string, { filename: string; mimeType: string }>;
  downloadingAttachment: string | null;
  decryptedBody: string;
  onDownload: (attachmentId: string) => void;
}

export default function MessageAttachments({
  message,
  decryptedAttachments,
  downloadingAttachment,
  decryptedBody,
  onDownload,
}: MessageAttachmentsProps) {
  if (message.attachments.length === 0) {
    return null;
  }

  return (
    <div className="card-cyber p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Paperclip className="w-5 h-5" />
        Attachments ({message.attachments.length})
      </h3>
      <div className="space-y-2">
        {message.attachments.map((att) => {
          const decryptedMeta = decryptedAttachments.get(att.id);
          const isDownloading = downloadingAttachment === att.id;

          return (
            <div key={att.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-sm">
              <Paperclip className="w-4 h-4 text-dark-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dark-300 truncate">
                  {decryptedMeta?.filename ||
                    (decryptedBody ? "[Decryption error]" : "[Encrypted attachment]")}
                </p>
                <p className="text-xs text-dark-500">
                  {(att.size / 1024).toFixed(1)} KB
                  {decryptedMeta?.mimeType && ` • ${decryptedMeta.mimeType}`}
                </p>
              </div>
              <button
                onClick={() => onDownload(att.id)}
                disabled={!decryptedBody || isDownloading}
                className="p-2 text-dark-400 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={decryptedBody ? "Download attachment" : "Decrypt message first"}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
