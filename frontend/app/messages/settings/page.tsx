"use client";

import { useAuth } from "@/contextAPI/auth-context";
import ProfileSection from "@/components/messages/settings/ProfileSection";
import TwoFactorSection from "@/components/messages/settings/TwoFactorSection";
import ChangePasswordSection from "@/components/messages/settings/ChangePasswordSection";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold font-mono">Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <ProfileSection user={user} />
        <TwoFactorSection isEnabled={user?.totp_enabled || false} onUpdate={refreshUser} />
        <ChangePasswordSection />
      </div>
    </div>
  );
}
