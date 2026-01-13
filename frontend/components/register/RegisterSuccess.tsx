"use client";

import { Check } from "lucide-react";
import Link from "next/link";

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Account created!</h1>
        <p className="text-dark-400 mb-6">You will be redirected to the login page shortly.</p>
        <Link href="/login" className="btn-primary">
          Go to login
        </Link>
      </div>
    </div>
  );
}
