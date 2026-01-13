import { Shield, ShieldCheck, Lock, Loader2 } from "lucide-react";

interface MessageContentProps {
  isAutoDecrypting: boolean;
  decryptedSubject: string;
  decryptedBody: string;
  hasEncryptedKey: boolean;
  onDecrypt: () => void;
  onVerify: () => void;
}

export default function MessageContent({
  isAutoDecrypting,
  decryptedSubject,
  decryptedBody,
  hasEncryptedKey,
  onDecrypt,
  onVerify,
}: MessageContentProps) {
  return (
    <div className="card-cyber p-6">
      {isAutoDecrypting ? (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Decrypting...</h3>
          <p className="text-dark-400">Automatically decrypting message</p>
        </div>
      ) : decryptedBody ? (
        <>
          <h2 className="text-xl font-bold mb-4">{decryptedSubject}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-dark-300">{decryptedBody}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-green-400">Message decrypted successfully</span>
              </div>
              <button
                onClick={onVerify}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-sm text-primary-400 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Verify E2E
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Lock className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Encrypted content</h3>
          <p className="text-dark-400 mb-6">
            {hasEncryptedKey
              ? "Session expired or key is not available. Click the button to decrypt the message."
              : "You cannot decrypt this message (no key available)"}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasEncryptedKey && (
              <button onClick={onDecrypt} className="btn-primary">
                <Shield className="w-4 h-4 mr-2" />
                Decrypt message
              </button>
            )}
            <button onClick={onVerify} className="btn-secondary flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verify E2E
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
