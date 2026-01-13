"use client";

import { Check, X } from "lucide-react";

export default function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? "text-primary-400" : "text-dark-500"}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}
