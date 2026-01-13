"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";

interface ResetPasswordFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  error: string;
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
}

export default function ResetPasswordForm({
  handleSubmit,
  error,
  email,
  setEmail,
  isLoading,
}: ResetPasswordFormProps) {
  return (
    <form onSubmit={handleSubmit} className="card-cyber glow-border p-8 animate-fade-in">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-cyber pl-10"
            placeholder="twoj@email.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Wysyłanie...
          </>
        ) : (
          "Wyślij link resetujący"
        )}
      </button>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do logowania
        </Link>
      </div>
    </form>
  );
}
