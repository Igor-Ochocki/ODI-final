"use client";

import Link from "next/link";
import { AlertTriangle, Check } from "lucide-react";
import GenericHeader from "@/components/GenericHeader";

export default function SuccessView() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <GenericHeader
          title="Password Reset"
          description="Your password has been changed"
        />
        <div className="card-cyber glow-border p-8 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-primary-100 mb-2">
              Password Changed Successfully
            </h2>
            <p className="text-dark-400 mb-4">
              Your password has been reset. You will be redirected to the login page shortly.
            </p>
            <div className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-amber-400 text-sm font-medium mb-1">Important Notice</p>
                  <p className="text-dark-400 text-sm">
                    Your encryption keys have been regenerated. You will not be able to decrypt
                    messages received before this password reset. This is expected behavior for
                    end-to-end encryption.
                  </p>
                </div>
              </div>
            </div>
            <Link href="/login" className="btn-primary w-full">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
