import { useAuth } from "@/contextAPI/auth-context";
import { LogOut, LucideIcon, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { User } from "@/types/interfaces";

interface SidebarProps {
  user: User | null;
  navigation: {
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
  }[];
}
export default function Sidebar({ user, navigation }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-dark-900 border-r border-dark-800">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-800">
          <Shield className="w-8 h-8 text-primary-500" />
          <span className="font-mono text-xl font-bold text-glow">ODI</span>
        </div>

        <div className="px-4 py-4 border-b border-dark-800">
          <p className="font-mono text-sm text-primary-400 truncate">{user?.username}</p>
          <p className="text-xs text-dark-500 truncate">{user?.email}</p>
          {user?.totp_enabled && (
            <span className="inline-flex items-center mt-2 px-2 py-0.5 text-xs font-mono rounded-sm bg-primary-500/20 text-primary-400 border border-primary-500/30">
              2FA active
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-mono text-sm transition-colors ${
                  isActive
                    ? "bg-primary-500/10 text-primary-400 border-l-2 border-primary-500"
                    : "text-dark-400 hover:bg-dark-800 hover:text-dark-200"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500 text-dark-950">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm font-mono text-sm text-dark-400 hover:bg-dark-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
