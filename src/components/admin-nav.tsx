"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  CalendarDays,
  ExternalLink,
  LogOut,
  Shield,
  PlusCircle,
} from "lucide-react";

export default function AdminNav() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      name: "Events Management",
      href: "/admin/events",
      icon: CalendarDays,
      active: pathname.startsWith("/admin/events"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Branding & Tag */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-maroon text-white flex items-center justify-center font-bold shadow-xs">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 leading-tight text-base">
                  SRMS Events
                </span>
                <span className="text-[10px] font-semibold text-maroon uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.active
                        ? "bg-maroon/10 text-maroon"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-gray-900 hidden sm:flex items-center gap-1.5"
              >
                <span>Live Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>

            <Link href="/admin/events?action=new">
              <Button
                size="sm"
                className="bg-maroon hover:bg-maroon/90 text-white text-xs shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                <span>New Event</span>
              </Button>
            </Link>

            {/* Admin Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-2 py-1 outline-none transition-colors cursor-pointer">
                <Avatar className="h-8 w-8 bg-maroon text-white">
                  <AvatarFallback className="bg-maroon text-white text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-xs font-medium text-gray-700">
                  {profile?.full_name || "Admin"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-900">
                    {profile?.full_name}
                  </p>
                  <p className="text-[11px] text-gray-500">{profile?.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-maroon/10 text-maroon uppercase">
                    Admin
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/events")}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Manage Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Student View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
