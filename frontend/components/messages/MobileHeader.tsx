import { Bell, Menu, Shield } from "lucide-react";

interface MobileHeaderProps {
  unreadCount: number;
  setSidebarOpen: (open: boolean) => void;
}

export default function MobileHeader({ unreadCount, setSidebarOpen }: MobileHeaderProps) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-dark-900 border-b border-dark-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary-500" />
          <span className="font-mono font-bold text-glow">ODI</span>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-dark-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-primary-500 rounded-full flex items-center justify-center text-dark-950">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-dark-400 hover:text-dark-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
