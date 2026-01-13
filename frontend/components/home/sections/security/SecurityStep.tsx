"use client";

interface SecurityStepProps {
  number: number;
  title: string;
  description: string;
}

export default function SecurityStep({ number, title, description }: SecurityStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/50 flex items-center justify-center font-mono font-bold text-primary-400">
        {number}
      </div>
      <div>
        <h3 className="font-mono font-semibold mb-1">{title}</h3>
        <p className="text-dark-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
