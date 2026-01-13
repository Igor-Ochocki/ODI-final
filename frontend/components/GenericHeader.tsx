"use client";

import { Shield } from "lucide-react";

interface GenericHeaderProps {
  title: string;
  description: string;
}

export default function GenericHeader({ title, description }: GenericHeaderProps) {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="inline-flex items-center gap-3 mb-4">
        <Shield className="w-10 h-10 text-primary-500" />
        <span className="text-3xl font-bold text-primary-100">ODI Final Project</span>
      </div>
      <h1 className="text-2xl font-semibold text-primary-100">{title}</h1>
      <p className="text-dark-400 mt-2">{description}</p>
    </div>
  );
}
