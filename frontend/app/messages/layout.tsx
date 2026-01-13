"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contextAPI/auth-context";
import { api } from "@/lib/api";
import { Inbox, Send, PenSquare, Settings } from "lucide-react";
import Sidebar from "@/components/messages/Sidebar";
import MobileSidebar from "@/components/messages/MobileSidebar";
import MobileHeader from "@/components/messages/MobileHeader";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchUnread = async () => {
      const response = await api.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    };

    if (isAuthenticated) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);

      const handleMessageRead = () => {
        fetchUnread();
      };
      window.addEventListener("message-read", handleMessageRead);

      return () => {
        clearInterval(interval);
        window.removeEventListener("message-read", handleMessageRead);
      };
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    {
      name: "Inbox",
      href: "/messages",
      icon: Inbox,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: "Sent", href: "/messages/sent", icon: Send },
    { name: "New message", href: "/messages/compose", icon: PenSquare },
    { name: "Settings", href: "/messages/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar user={user} navigation={navigation} />

      <MobileHeader unreadCount={unreadCount} setSidebarOpen={setSidebarOpen} />

      {sidebarOpen && (
        <MobileSidebar user={user} setSidebarOpen={setSidebarOpen} navigation={navigation} />
      )}
      <main className="flex-1 md:ml-64">
        <div className="pt-14 md:pt-0">{children}</div>
      </main>
    </div>
  );
}
