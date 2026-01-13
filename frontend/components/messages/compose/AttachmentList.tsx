import { Paperclip, X } from "lucide-react";

interface AttachmentFile {
  file: File;
  id: string;
}

interface AttachmentListProps {
  attachments: AttachmentFile[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}

export default function AttachmentList({
  attachments,
  fileInputRef,
  onFileSelect,
  onRemove,
}: AttachmentListProps) {
  return (
    <div>
      <label className="block text-sm font-mono text-dark-300 mb-2">Attachments:</label>

      <input ref={fileInputRef} type="file" multiple onChange={onFileSelect} className="hidden" />

      <div className="space-y-2">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-sm">
            <Paperclip className="w-4 h-4 text-dark-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dark-200 truncate">{att.file.name}</p>
              <p className="text-xs text-dark-500">{(att.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => onRemove(att.id)}
              className="p-1 text-dark-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 p-3 w-full border border-dashed border-dark-600 rounded-sm text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
        >
          <Paperclip className="w-4 h-4" />
          Add attachment (max 25 MB)
        </button>
      </div>
    </div>
  );
}
