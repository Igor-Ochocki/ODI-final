import { Shield, Loader2, AlertCircle } from "lucide-react";

interface DecryptModalProps {
  isOpen: boolean;
  isDecrypting: boolean;
  error: string;
  onClose: () => void;
  onDecrypt: () => void;
}

export default function DecryptModal({
  isOpen,
  isDecrypting,
  error,
  onClose,
  onDecrypt,
}: DecryptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm px-4">
      <div className="card-cyber glow-border p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Decrypt message</h3>
        <p className="text-dark-400 text-sm mb-6">
          Click the button below to decrypt the message using your private key.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onDecrypt}
            disabled={isDecrypting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isDecrypting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Decrypting...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Decrypt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
