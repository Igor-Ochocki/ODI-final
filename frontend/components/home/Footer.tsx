"use client";

import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-dark-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            <span className="font-mono text-sm text-dark-400">ODI Final Project</span>
          </div>
          <p className="text-sm text-dark-500">Final project - ODI 2026</p>
        </div>
      </div>
    </footer>
  );
}
