"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import GenericHeader from "@/components/GenericHeader";

export default function InvalidTokenView() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <GenericHeader
          title="Invalid Link"
          description="This password reset link is invalid"
        />
        <div className="card-cyber glow-border p-8 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-primary-100 mb-2">
              Missing Reset Token
            </h2>
            <p className="text-dark-400 mb-6">
              This link doesn't contain a valid reset token. Please request a new password reset.
            </p>
            <Link href="/forgot-password" className="btn-primary">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
