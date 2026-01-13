"use client";

import { CheckCircle, Key, Lock, Mail } from "lucide-react";
import FeatureCard from "./FeatureCard";

export default function Features() {
  return (
    <section id="features" className="py-20 bg-dark-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Security at <span className="text-primary-400">the forefront</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="E2E Encryption"
            description="Messages are encrypted on your device. The server never sees the content."
          />
          <FeatureCard
            icon={<Key className="w-8 h-8" />}
            title="2FA / TOTP"
            description="Two-factor authentication protects your account from unauthorized access."
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Digital signatures"
            description="Each message is signed - you can verify the sender."
          />
          <FeatureCard
            icon={<Mail className="w-8 h-8" />}
            title="Secure attachments"
            description="Attachments are encrypted together with the message. Full data protection."
          />
        </div>
      </div>
    </section>
  );
}
