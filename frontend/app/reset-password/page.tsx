"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import GenericHeader from "@/components/GenericHeader";
import InvalidTokenView from "@/components/reset-password/InvalidTokenView";
import SuccessView from "@/components/reset-password/SuccessView";
import NewPasswordForm from "@/components/reset-password/NewPasswordForm";
import { checkPasswordStrength, PasswordStrength } from "@/utils/utils";
import { generateRSAKeyPair, exportRSAPublicKey } from "@/lib/crypto";
import { api } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.score < 5) {
      setError("Password does not meet all requirements");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const cryptoKeyPair = await generateRSAKeyPair();
      const publicKeyPem = await exportRSAPublicKey(cryptoKeyPair.publicKey);

      await api.request("/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: password,
          new_signing_public_key: publicKeyPem,
        }),
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      if (errorMessage.includes("Invalid or expired")) {
        setError("This reset link has expired or is invalid. Please request a new one.");
      } else {
        setError(errorMessage || "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <InvalidTokenView />;
  }

  if (success) {
    return <SuccessView />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <GenericHeader title="Reset Password" description="Enter your new password" />
        <NewPasswordForm
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          passwordStrength={passwordStrength}
          error={error}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
