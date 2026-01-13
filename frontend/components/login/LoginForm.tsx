"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contextAPI/auth-context";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [honeypot1, setHoneypot1] = useState("");
  const [honeypot2, setHoneypot2] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (honeypot1 || honeypot2) {
      setTimeout(() => {
        router.push("/messages");
      }, 2000);
      return;
    }

    try {
      const result = await login({
        email,
        password,
        totp_code: show2FA ? totpCode : undefined,
      });

      if (result.requires2FA) {
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      if (result.success) {
        router.push("/messages");
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-cyber space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot1}
          onChange={(e) => setHoneypot1(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
        <input
          type="text"
          name="fax"
          value={honeypot2}
          onChange={(e) => setHoneypot2(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-mono text-dark-300 mb-2">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-cyber"
          placeholder="your@email.com"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-mono text-dark-300 mb-2">
          Password
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
            autoComplete="current-password"
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
      </div>

      {show2FA && (
        <div className="animate-fade-in">
          <label htmlFor="totp" className="block text-sm font-mono text-dark-300 mb-2">
            2FA Code
          </label>
          <input
            id="totp"
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input-cyber text-center text-2xl tracking-widest font-mono"
            placeholder="000000"
            maxLength={6}
            required
            autoComplete="one-time-code"
            autoFocus
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-dark-500">
            Enter the 6-digit code from the authenticator app
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </button>

      <div className="text-center text-sm text-dark-400">
        <Link href="/forgot-password" className="hover:text-primary-400 transition-colors">
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}
