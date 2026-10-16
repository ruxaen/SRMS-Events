"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // used for the building background
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LogIn,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import SrmsLogo from "@/components/srms-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, loginAsDemo } = useAuth();

  function handleQuickDemoStudent() {
    loginAsDemo("student", {
      full_name: "Rooshan",
      email: "rooshan@srms.ac.in",
      student_id: "2500140100077",
      department: "Computer Science & Engineering",
      year: "2nd Year",
    });
    toast.success("Welcome, Rooshan! Exploring as Student.");
    router.push("/");
  }

  function handleQuickDemoAdmin() {
    loginAsDemo("admin", {
      full_name: "Prof. R. K. Sharma",
      email: "admin@srms.ac.in",
    });
    toast.success("Admin access granted. Opening Admin Console.");
    router.push("/admin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      // If it's a fetch or connection issue, offer instant demo fallback
      if (signInError.includes("fetch") || signInError.includes("Failed")) {
        loginAsDemo("student", {
          email,
          full_name: email.split("@")[0].replace(".", " "),
        });
        toast.info("Offline mode: Logged in locally.");
        router.push("/");
        return;
      }
      setError(signInError);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - SRMS Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-maroon">
        <Image
          src="/images/srms-building.jpg"
          alt="SRMS College Building"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon/90 to-maroon-dark/70" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <SrmsLogo variant="light" textSize="text-3xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to SRMS Events</h1>
          <p className="text-lg text-white/80 max-w-md">
            Discover and register for exciting events happening on campus.
            Technical fests, cultural nights, workshops, and sports tournaments.
          </p>
          <div className="mt-8 p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 max-w-md">
            <p className="text-xs text-white/90 font-medium">
              💡 <strong>Instant Viva Demo:</strong> You can click the quick demo buttons on the right to bypass login and test all student & admin workflows directly!
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <SrmsLogo className="mx-auto mb-3" />
          </div>

          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-maroon/10 rounded-full flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-maroon" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-xs text-gray-500 mt-1">
                Access your SRMS Events account or explore directly
              </p>
            </CardHeader>

            <CardContent className="pt-2">
              {/* Direct Quick Access Buttons */}
              <div className="mb-6 p-3.5 bg-maroon/5 border border-maroon/20 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-maroon">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Direct Dashboard Access (Instant Demo)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={handleQuickDemoStudent}
                    className="bg-maroon hover:bg-maroon/90 text-white text-xs h-9 shadow-xs"
                  >
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Student View
                  </Button>
                  <Button
                    type="button"
                    onClick={handleQuickDemoAdmin}
                    variant="outline"
                    className="border-maroon/30 text-maroon hover:bg-maroon/10 text-xs h-9"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Admin View
                  </Button>
                </div>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">or sign in with credentials</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@srms.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-9 text-sm pr-9"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-maroon hover:bg-maroon-dark text-white text-sm h-10 shadow-xs"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-xs text-gray-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-maroon font-semibold hover:underline"
                  >
                    Create student account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
