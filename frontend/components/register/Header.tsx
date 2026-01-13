"use client";

import { Shield } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <div className="text-center mb-8">
      <Link href="/" className="inline-flex items-center gap-3">
        <Shield className="w-10 h-10 text-primary-500" />
        <span className="font-mono text-2xl font-bold text-glow">ODI Final Project</span>
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Create an account</h1>
      <p className="mt-2 text-dark-400">Join the secure communication</p>
    </div>
  );
}
