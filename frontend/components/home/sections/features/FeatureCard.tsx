"use client";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card-cyber group hover:border-primary-500/50 transition-colors">
      <div className="text-primary-500 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-mono font-semibold mb-2">{title}</h3>
      <p className="text-sm text-dark-400">{description}</p>
    </div>
  );
}
