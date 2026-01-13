"use client";

import { useState } from "react";
import SubmittedForm from "@/components/forgot-password/SubmittedForm";
import ResetPasswordForm from "@/components/forgot-password/ResetPasswordForm";
import GenericHeader from "@/components/GenericHeader";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.request("/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setSubmitted(true);
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return <SubmittedForm />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <GenericHeader
          title="Password reset"
          description="Enter the email associated with your account"
        />
        <ResetPasswordForm
          handleSubmit={handleSubmit}
          error={error}
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
        />

        <p className="text-center text-dark-500 text-sm mt-6">
          Didn't receive an email? Check your spam folder or{" "}
          <button
            onClick={() => setSubmitted(false)}
            className="text-primary-400 hover:text-primary-300"
          >
            try again
          </button>
        </p>
      </div>
    </div>
  );
}
