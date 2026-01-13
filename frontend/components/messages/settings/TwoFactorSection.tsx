"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Key, AlertCircle, Check, Loader2, Copy } from "lucide-react";

interface TwoFactorSectionProps {
  isEnabled: boolean;
  onUpdate: () => void;
}

export default function TwoFactorSection({ isEnabled, onUpdate }: TwoFactorSectionProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qr_code: string;
    backup_codes: string[];
    provisioning_uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSetup = async () => {
    setIsSettingUp(true);
    setError("");

    try {
      const response = await api.setup2FA();
      if (response.data) {
        setSetupData(response.data);
      } else {
        setError(response.message || "2FA setup error");
      }
    } catch {
      setError("Connection error");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await api.verify2FA(verifyCode);
      if (response.data?.success) {
        setSetupData(null);
        setVerifyCode("");
        onUpdate();
      } else {
        setError(response.message || "Invalid code");
      }
    } catch {
      setError("Verification error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length < 6) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await api.disable2FA(disableCode);
      if (response.data?.success) {
        setShowDisable(false);
        setDisableCode("");
        onUpdate();
      } else {
        setError(response.message || "Invalid code");
      }
    } catch {
      setError("2FA disable error");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backup_codes) {
      navigator.clipboard.writeText(setupData.backup_codes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <section className="card-cyber">
      <h2 className="text-lg font-mono font-semibold mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-primary-500" />
        Two-Factor Authentication (2FA)
      </h2>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {isEnabled ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-primary-400 font-mono text-sm">2FA active</span>
          </div>

          {!showDisable ? (
            <button onClick={() => setShowDisable(true)} className="btn-danger text-sm">
              Disable 2FA
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-dark-400">
                Enter code from authenticator app or backup code:
              </p>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9A-Z-]/gi, ""))}
                className="input-cyber text-center font-mono"
                placeholder="2FA Code"
                maxLength={12}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDisable}
                  disabled={isVerifying || disableCode.length < 6}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm disable
                </button>
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                    setError("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : setupData ? (
        <div className="space-y-6">
          <p className="text-sm text-dark-400">
            Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) or enter
            the secret manually.
          </p>

          <div className="flex justify-center p-4 bg-white rounded-sm">
            <img
              src={`data:image/png;base64,${setupData.qr_code}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>

          <div>
            <label className="text-xs text-dark-500 font-mono">Secret (for manual entry):</label>
            <p className="font-mono text-sm bg-dark-800 p-2 rounded-sm break-all">
              {setupData.secret}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-dark-500 font-mono">
                Backup codes (save them securely!):
              </label>
              <button
                onClick={copyBackupCodes}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCodes ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 bg-dark-800 rounded-sm">
              {setupData.backup_codes.map((code, i) => (
                <code key={i} className="text-sm text-dark-300 font-mono">
                  {code}
                </code>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-400">
              ⚠️ Save these codes in a safe place. Each code can only be used once.
            </p>
          </div>

          <div>
            <label className="text-xs text-dark-500 font-mono mb-2 block">
              Enter code from app to confirm:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input-cyber text-center text-xl font-mono tracking-widest flex-1"
                placeholder="000000"
                maxLength={6}
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || verifyCode.length !== 6}
                className="btn-primary flex items-center gap-2"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Verify
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setSetupData(null);
              setVerifyCode("");
              setError("");
            }}
            className="btn-secondary w-full"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-dark-400 mb-4">
            2FA adds an extra layer of security. Once enabled, you'll need a code from your
            authenticator app when logging in.
          </p>
          <button
            onClick={handleSetup}
            disabled={isSettingUp}
            className="btn-primary flex items-center gap-2"
          >
            {isSettingUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Enable 2FA
          </button>
        </div>
      )}
    </section>
  );
}
