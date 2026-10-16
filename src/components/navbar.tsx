"use client";

import Link from "next/link";
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
import SrmsLogo from "@/components/srms-logo";
import { LogOut, Calendar, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { profile, signOut } = useAuth();
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
    : "U";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <SrmsLogo />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link href="/registrations">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-maroon"
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Registrations
              </Button>
            </Link>

            {profile?.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-maroon"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-2 py-1 outline-none transition-colors cursor-pointer">
                <Avatar className="h-8 w-8 bg-maroon text-white">
                  <AvatarFallback className="bg-maroon text-white text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {profile?.full_name || "User"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/registrations")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  My Registrations
                </DropdownMenuItem>
                {profile?.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
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
    </nav>
  );
}
