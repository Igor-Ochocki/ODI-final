"use client";

import { Shield } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-dark-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-500" />
          <span className="font-mono text-xl font-bold text-glow">ODI Final Project</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="btn-secondary">
            Login
          </Link>
          <Link href="/register" className="btn-primary">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
