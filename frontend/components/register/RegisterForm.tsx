"use client";

import { useAuth } from "@/contextAPI/auth-context";
import { checkPasswordStrength, PasswordStrength } from "@/utils/utils";
import { generateRSAKeyPair, exportRSAPublicKey } from "@/lib/crypto";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PasswordRequirement from "./PasswordRequirement";
import { storeKeyPairByEmail } from "@/lib/indexeddb";

interface RegisterFormProps {
  success: boolean;
  setSuccess: (success: boolean) => void;
}

export default function RegisterForm({ success, setSuccess }: RegisterFormProps) {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      digit: false,
      special: false,
    },
  });

  const [honeypot1, setHoneypot1] = useState("");
  const [honeypot2, setHoneypot2] = useState("");

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (honeypot1 || honeypot2) {
      setSuccess(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.score < 5) {
      setError("Password does not meet all requirements");
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      setError(
        "Username must start with a letter and contain only letters, numbers and underscores"
      );
      return;
    }

    setIsLoading(true);

    try {
      const cryptoKeyPair = await generateRSAKeyPair();
      const publicKeyPem = await exportRSAPublicKey(cryptoKeyPair.publicKey);

      const result = await register({
        email,
        username,
        password,
        signing_public_key: publicKeyPem,
      });

      if (result.success) {
        try {
          await storeKeyPairByEmail(email, cryptoKeyPair);
          setSuccess(true);
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } catch (keyError) {
          console.error("Failed to store private key:", keyError);
          setError("Account created but failed to store encryption keys. Please contact support.");
        }
      } else {
        setError(result.error || "Registration error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-cyber space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true">
        <input
          type="text"
          name="fax_number_hp"
          value={honeypot1}
          onChange={(e) => setHoneypot1(e.target.value)}
          tabIndex={-1}
          autoComplete="new-password"
          data-lpignore="true"
          data-form-type="other"
        />
        <input
          type="text"
          name="middle_initial_hp"
          value={honeypot2}
          onChange={(e) => setHoneypot2(e.target.value)}
          tabIndex={-1}
          autoComplete="new-password"
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-mono text-dark-300 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-cyber"
          placeholder="twoj@email.com"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-mono text-dark-300 mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="input-cyber"
          placeholder="john_doe"
          minLength={3}
          maxLength={50}
          required
          autoComplete="username"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-dark-500">
          3-50 characters, letters, numbers and underscores
        </p>
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
          Confirm password
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-xs text-dark-500 text-center">
        By creating an account, you accept our terms of use and privacy policy.
      </p>
    </form>
  );
}
