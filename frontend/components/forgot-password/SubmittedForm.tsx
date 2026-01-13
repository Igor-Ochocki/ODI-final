"use client";

import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SubmittedForm() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card-cyber glow-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary-400" />
          </div>

          <h1 className="text-2xl font-bold text-primary-100 mb-4">Check your email</h1>

          <p className="text-dark-400 mb-6">
            If the account with the provided email exists, we have sent a password reset link. Link
            is valid for 1 hour.
          </p>

          <Link href="/login" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
