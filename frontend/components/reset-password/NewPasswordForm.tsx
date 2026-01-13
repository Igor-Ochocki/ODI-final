"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import PasswordRequirement from "@/components/register/PasswordRequirement";
import { PasswordStrength } from "@/utils/utils";

interface NewPasswordFormProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordStrength: PasswordStrength;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function NewPasswordForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  passwordStrength,
  error,
  isLoading,
  onSubmit,
}: NewPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="card-cyber glow-border p-8 animate-fade-in space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-sm font-medium mb-1">Warning</p>
            <p className="text-dark-400 text-sm">
              Resetting your password will generate new encryption keys. You will lose access to
              all previously received encrypted messages.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-mono text-dark-300 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-cyber pr-12"
            placeholder="••••••••••••"
            required
            autoComplete="new-password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {password && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength.score >= level
                      ? level <= 2
                        ? "bg-red-500"
                        : level <= 4
                          ? "bg-amber-500"
                          : "bg-primary-500"
                      : "bg-dark-700"
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <PasswordRequirement
                met={passwordStrength.requirements.length}
                text="Min. 12 characters"
              />
              <PasswordRequirement
                met={passwordStrength.requirements.uppercase}
                text="Uppercase letter"
              />
              <PasswordRequirement
                met={passwordStrength.requirements.lowercase}
                text="Lowercase letter"
              />
              <PasswordRequirement met={passwordStrength.requirements.digit} text="Number" />
              <PasswordRequirement
                met={passwordStrength.requirements.special}
                text="Special character"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-mono text-dark-300 mb-2">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`input-cyber ${
            confirmPassword && password !== confirmPassword
              ? "border-red-500 focus:border-red-500"
              : ""
          }`}
          placeholder="••••••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || passwordStrength.score < 5 || password !== confirmPassword}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset Password"
        )}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-primary-400 hover:text-primary-300 text-sm">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
