"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Eye, EyeOff, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SrmsLogo from "@/components/srms-logo";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "MBA",
  "MCA",
  "Pharmacy",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    studentId: "",
    department: "",
    year: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp, loginAsDemo } = useAuth();

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleInstantDemo() {
    loginAsDemo("student", {
      full_name: formData.fullName || "Rooshan",
      email: formData.email || "rooshan@srms.ac.in",
      student_id: formData.studentId || "2500140100077",
      department: formData.department || "Computer Science & Engineering",
      year: formData.year || "2nd Year",
    });
    toast.success("Welcome! Direct student access active.");
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.studentId ||
      !formData.department ||
      !formData.year
    ) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      {
        full_name: formData.fullName,
        student_id: formData.studentId,
        department: formData.department,
        year: formData.year,
      }
    );

    if (signUpError) {
      // If network/placeholder error, auto fall back
      if (signUpError.includes("fetch") || signUpError.includes("Failed")) {
        handleInstantDemo();
        return;
      }
      setError(signUpError);
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
          <h1 className="text-4xl font-bold mb-4">Join SRMS Events</h1>
          <p className="text-lg text-white/80 max-w-md">
            Create your account to start registering for events. Stay connected
            with campus activities.
          </p>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <SrmsLogo className="mx-auto mb-4" />
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 bg-maroon/10 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-7 w-7 text-maroon" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Register as a student on SRMS Events
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="mb-4 p-3 bg-maroon/5 border border-maroon/20 rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs text-maroon font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Want to bypass registration?</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInstantDemo}
                  className="bg-maroon hover:bg-maroon/90 text-white text-xs h-7 shadow-xs shrink-0"
                >
                  Direct Student Access
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">College Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@srms.ac.in"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
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

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student / Roll Number</Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., 2024CSE001"
                    value={formData.studentId}
                    onChange={(e) => updateField("studentId", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(v) => updateField("department", v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(v) => updateField("year", v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-maroon hover:bg-maroon-dark text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-maroon font-medium hover:underline"
                  >
                    Sign in
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
