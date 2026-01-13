import { useAuth } from "@/contextAPI/auth-context";
import { User } from "@/types/interfaces";
import { LogOut, LucideIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";

interface MobileSidebarProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  navigation: {
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
  }[];
}

export default function MobileSidebar({ user, setSidebarOpen, navigation }: MobileSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="fixed inset-0 bg-dark-950/80" onClick={() => setSidebarOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-64 bg-dark-900 border-l border-dark-800 animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
          <span className="font-mono font-semibold">{user?.username}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-dark-400 hover:text-dark-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-mono text-sm transition-colors ${
                  isActive
                    ? "bg-primary-500/10 text-primary-400"
                    : "text-dark-400 hover:bg-dark-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500 text-dark-950">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm font-mono text-sm text-dark-400 hover:bg-dark-800 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </nav>
      </div>
    </div>
  );
}
