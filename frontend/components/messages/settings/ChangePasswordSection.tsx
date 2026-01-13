"use client";

import { useState } from "react";
import { useAuth } from "@/contextAPI/auth-context";
import { api } from "@/lib/api";
import { generateRSAKeyPair, exportRSAPublicKey } from "@/lib/crypto";
import { Lock, AlertCircle, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { storeKeyPair } from "@/lib/indexeddb";

export default function ChangePasswordSection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const keyPair = await generateRSAKeyPair();
      const publicKeyPem = await exportRSAPublicKey(keyPair.publicKey);

      const response = await api.changePassword(currentPassword, newPassword, publicKeyPem);

      if (response.error) {
        setError(response.message || "Password change error");
      } else {
        if (user?.id) {
          try {
            await storeKeyPair(user.id, keyPair);
          } catch (keyError) {
            console.error("Failed to update private key:", keyError);
            setError(
              "Password changed but there was a problem with encryption keys. Please log in again."
            );
          }
        }

        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError("Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card-cyber">
      <h2 className="text-lg font-mono font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary-500" />
        Change Password
      </h2>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-primary-500/10 border border-primary-500/30 rounded-sm text-primary-400 text-sm">
          <Check className="w-4 h-4" />
          <span>Password has been changed</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-dark-500 font-mono mb-1">Current password</label>
          <div className="relative">
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-cyber pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-dark-500 font-mono mb-1">
            New password (min. 12 characters)
          </label>
          <input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-cyber"
            minLength={12}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-dark-500 font-mono mb-1">Confirm new password</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`input-cyber ${
              confirmPassword && newPassword !== confirmPassword ? "border-red-500" : ""
            }`}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Change password
        </button>
      </form>
    </section>
  );
}
