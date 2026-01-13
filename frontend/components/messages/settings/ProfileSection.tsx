import { Shield } from "lucide-react";
import { User as UserType } from "@/types/interfaces";

interface ProfileSectionProps {
  user: UserType | null;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  return (
    <section className="card-cyber">
      <h2 className="text-lg font-mono font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary-500" />
        Profile
      </h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-dark-500 font-mono">Email</label>
          <p className="text-dark-200">{user?.email}</p>
        </div>
        <div>
          <label className="text-xs text-dark-500 font-mono">Username</label>
          <p className="text-dark-200">{user?.username}</p>
        </div>
        <div>
          <label className="text-xs text-dark-500 font-mono">Account created</label>
          <p className="text-dark-200">
            {user?.created_at &&
              new Date(user.created_at).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
          </p>
        </div>
      </div>
    </section>
  );
}
