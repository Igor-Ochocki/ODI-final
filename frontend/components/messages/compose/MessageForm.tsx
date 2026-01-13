interface MessageFormProps {
  subject: string;
  body: string;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
}

export default function MessageForm({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: MessageFormProps) {
  return (
    <>
      <div>
        <label htmlFor="subject" className="block text-sm font-mono text-dark-300 mb-2">
          Subject:
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="input-cyber"
          placeholder="Message subject"
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-mono text-dark-300 mb-2">
          Body:
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          className="input-cyber min-h-[200px] resize-y"
          placeholder="Enter message body..."
        />
      </div>

      <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-sm">
        <p className="text-xs text-primary-400/80">
          🔐 The message will be encrypted with each recipient's public key and yours. Only you and
          the recipients will be able to decrypt it with your private keys. The server never has
          access to the message content.
        </p>
      </div>
    </>
  );
}
