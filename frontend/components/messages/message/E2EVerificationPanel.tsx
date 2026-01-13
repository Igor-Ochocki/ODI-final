import { ShieldCheck, CheckCircle2, XCircle, Info, Key, Lock, ChevronUp } from "lucide-react";

interface VerificationDetails {
  privateKeyStored: boolean;
  canDecrypt: boolean;
  encryptionAlgorithm: string;
  keySize: string;
  publicKeyFingerprint?: string;
  messageFingerprint?: string;
}

interface E2EVerificationPanelProps {
  verificationDetails: VerificationDetails;
  onClose: () => void;
}

export default function E2EVerificationPanel({
  verificationDetails,
  onClose,
}: E2EVerificationPanelProps) {
  return (
    <div className="card-cyber p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-400" />
          End-to-End Encryption Verification
        </h3>
        <button onClick={onClose} className="p-1 text-dark-400 hover:text-dark-200">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-sm">
          <div className="mt-0.5">
            {verificationDetails.privateKeyStored ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-dark-200 mb-1">Private key stored locally</div>
            <div className="text-sm text-dark-400">
              {verificationDetails.privateKeyStored
                ? "Your private key is stored in a secure local database (IndexedDB) and never leaves your device."
                : "Private key is not available. You may be logged in on a different device."}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-sm">
          <div className="mt-0.5">
            {verificationDetails.canDecrypt ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-dark-200 mb-1">Message decryption capability</div>
            <div className="text-sm text-dark-400">
              {verificationDetails.canDecrypt
                ? "You have access to the private key needed to decrypt this message. This confirms the server never had access to the content."
                : "Cannot decrypt - no private key available. This message may have been encrypted with a different key or on another device."}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-sm">
          <div className="mt-0.5">
            <Info className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-dark-200 mb-1">Encryption algorithms</div>
            <div className="text-sm text-dark-400 space-y-1">
              <div>• Symmetric key: {verificationDetails.encryptionAlgorithm.split(" + ")[1]}</div>
              <div>• Key exchange: {verificationDetails.encryptionAlgorithm.split(" + ")[0]}</div>
              <div>• Key size: {verificationDetails.keySize}</div>
            </div>
          </div>
        </div>

        {verificationDetails.publicKeyFingerprint && (
          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-sm">
            <div className="mt-0.5">
              <Key className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-dark-200 mb-1">Sender public key fingerprint</div>
              <div className="text-sm font-mono text-primary-400 bg-dark-900/50 p-2 rounded-sm break-all">
                {verificationDetails.publicKeyFingerprint}
              </div>
              <div className="text-xs text-dark-500 mt-1">
                This fingerprint confirms the authenticity of the sender's public key
              </div>
            </div>
          </div>
        )}

        {verificationDetails.messageFingerprint && (
          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-sm">
            <div className="mt-0.5">
              <Lock className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-dark-200 mb-1">Encrypted message fingerprint</div>
              <div className="text-sm font-mono text-primary-400 bg-dark-900/50 p-2 rounded-sm break-all">
                {verificationDetails.messageFingerprint}
              </div>
              <div className="text-xs text-dark-500 mt-1">
                Unique identifier of encrypted content - server only sees this fingerprint, not the
                content
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-sm">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-primary-300">
              <strong>End-to-End Encryption:</strong> This message was encrypted before being sent
              to the server. The server cannot decrypt the content - only you and the recipients
              have access to the private keys needed to read the message.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
