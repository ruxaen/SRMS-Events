"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { DEMO_STUDENT, DEMO_ADMIN } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      student_id: string;
      department: string;
      year: string;
    }
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: "student" | "admin", customData?: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = "srms_demo_user";
const DEMO_PROFILE_KEY = "srms_demo_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch user profile from the profiles table
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Could not fetch profile from Supabase:", error.message);
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  }

  // Refresh profile data
  async function refreshProfile() {
    if (isDemoMode && profile) {
      return;
    }
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) setProfile(profileData);
    }
  }

  // Quick 1-click Demo Login
  function loginAsDemo(role: "student" | "admin", customData?: Partial<Profile>) {
    const baseProfile = role === "admin" ? DEMO_ADMIN : DEMO_STUDENT;
    const activeProfile: Profile = {
      ...baseProfile,
      ...customData,
      role,
    };

    const mockUser = {
      id: activeProfile.id,
      email: activeProfile.email,
      app_metadata: {},
      user_metadata: {
        full_name: activeProfile.full_name,
        student_id: activeProfile.student_id,
        department: activeProfile.department,
        year: activeProfile.year,
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;

    setUser(mockUser);
    setProfile(activeProfile);
    setIsDemoMode(true);

    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(activeProfile));
    } catch (e) {
      console.warn("Could not store demo session in localStorage", e);
    }
  }

  useEffect(() => {
    // 1. First check if a demo session is saved in localStorage
    try {
      const savedDemoUser = localStorage.getItem(DEMO_USER_KEY);
      const savedDemoProfile = localStorage.getItem(DEMO_PROFILE_KEY);
      if (savedDemoUser && savedDemoProfile) {
        setUser(JSON.parse(savedDemoUser));
        setProfile(JSON.parse(savedDemoProfile));
        setIsDemoMode(true);
        setLoading(false);
        return;
      }
    } catch {
      // Ignore localStorage read errors
    }

    // 2. Otherwise try real Supabase session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).then((p) => {
            if (p) setProfile(p);
          });
        }
      })
      .catch((err) => {
        console.warn("Supabase session check skipped or failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoMode(false);
        const profileData = await fetchProfile(session.user.id);
        if (profileData) setProfile(profileData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password (with automatic demo fallback if offline)
  async function signUp(
    email: string,
    password: string,
    metadata: {
      full_name: string;
      student_id: string;
      department: string;
      year: string;
    }
  ) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        // If network/placeholder error, auto-fallback to demo session with their entered data
        if (
          error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("Load failed")
        ) {
          console.info("Supabase unreachable; logging in as offline demo student.");
          loginAsDemo("student", {
            full_name: metadata.full_name,
            email,
            student_id: metadata.student_id,
            department: metadata.department,
            year: metadata.year,
          });
          return { error: null };
        }
        return { error: error.message };
      }

      // Create profile record in Supabase
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: metadata.full_name,
          email: email,
          student_id: metadata.student_id,
          department: metadata.department,
          year: metadata.year,
          role: "student",
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      // Automatic fallback on fetch failure
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("fetch") || errorMsg.includes("NetworkError")) {
        loginAsDemo("student", {
          full_name: metadata.full_name,
          email,
          student_id: metadata.student_id,
          department: metadata.department,
          year: metadata.year,
        });
        return { error: null };
      }
      return { error: errorMsg };
    }
  }

  // Sign in with email and password (with demo fallback)
  async function signIn(email: string, password: string) {
    // If entered demo credentials or admin email
    if (
      email.toLowerCase().includes("admin") ||
      password === "admin123" ||
      password === "admin"
    ) {
      loginAsDemo("admin", { email });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase fetch error or offline, fall back to demo mode seamlessly
        if (
          error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("Load failed")
        ) {
          loginAsDemo("student", {
            email,
            full_name: email.split("@")[0].replace(".", " "),
          });
          return { error: null };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err: unknown) {
      // Auto fallback
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("fetch") || errorMsg.includes("NetworkError")) {
        loginAsDemo("student", {
          email,
          full_name: email.split("@")[0].replace(".", " "),
        });
        return { error: null };
      }
      return { error: errorMsg };
    }
  }

  // Sign out
  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      localStorage.removeItem(DEMO_PROFILE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoMode,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
