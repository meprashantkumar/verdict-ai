"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Scale, LayoutDashboard, Users, Briefcase, FileText,
  MessageSquare, BookOpen, Upload, BarChart3, Settings,
  Calendar, User
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/cases", label: "Cases", icon: Briefcase },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/drafts", label: "Draft Generator", icon: FileText },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/dashboard/templates", label: "Templates", icon: BookOpen },
  { href: "/dashboard/documents", label: "Documents", icon: Upload },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
        <Scale className="h-7 w-7 text-blue-400" />
        <span className="text-lg font-bold text-white">VerdictAI</span>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
