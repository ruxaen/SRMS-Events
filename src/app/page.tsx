"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Event, Announcement } from "@/lib/types";
import { INITIAL_MOCK_EVENTS, INITIAL_MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import Navbar from "@/components/navbar";
import SrmsLogo from "@/components/srms-logo";
import EventCard from "@/components/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Megaphone,
} from "lucide-react";

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    registered: 3,
    upcoming: 2,
    completed: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && profile) {
      // If admin, redirect to admin dashboard
      if (profile.role === "admin") {
        router.push("/admin");
        return;
      }
      fetchData();
    } else if (user) {
      fetchData();
    }
  }, [user, profile, authLoading]);

  async function fetchData() {
    try {
      // Fetch featured events
      const { data: featured, error: featErr } = await supabase
        .from("events")
        .select("*")
        .eq("featured", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(3);

      if (featErr || !featured || featured.length === 0) {
        setFeaturedEvents(INITIAL_MOCK_EVENTS.filter((e) => e.featured));
      } else {
        setFeaturedEvents(featured);
      }

      // Fetch upcoming events (non-featured or all)
      const { data: upcoming, error: upErr } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(8);

      if (upErr || !upcoming || upcoming.length === 0) {
        setUpcomingEvents(INITIAL_MOCK_EVENTS);
      } else {
        setUpcomingEvents(upcoming);
      }

      // Fetch announcements
      const { data: ann, error: annErr } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (annErr || !ann || ann.length === 0) {
        setAnnouncements(INITIAL_MOCK_ANNOUNCEMENTS);
      } else {
        setAnnouncements(ann);
      }

      // Fetch user registration stats
      if (user) {
        const { data: registrations } = await supabase
          .from("registrations")
          .select("*, events(*)")
          .eq("user_id", user.id)
          .eq("status", "registered");

        if (registrations && registrations.length > 0) {
          const regs = registrations;
          const now = new Date();
          const upcomingRegs = regs.filter(
            (r: { events: Event }) => r.events && new Date(r.events.event_date) >= now
          );
          const completedRegs = regs.filter(
            (r: { events: Event }) => r.events && new Date(r.events.event_date) < now
          );

          setStats({
            registered: regs.length,
            upcoming: upcomingRegs.length,
            completed: completedRegs.length,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching data, using mock data:", err);
      setFeaturedEvents(INITIAL_MOCK_EVENTS.filter((e) => e.featured));
      setUpcomingEvents(INITIAL_MOCK_EVENTS);
      setAnnouncements(INITIAL_MOCK_ANNOUNCEMENTS);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-maroon/30 border-t-maroon rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-[320px] md:h-[380px]">
        <Image
          src="/images/srms-building.jpg"
          alt="SRMS College"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-gray-50" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              Discover. Register.
            </h1>
            <p className="text-lg md:text-xl font-semibold drop-shadow-lg">
              Be Part of Something{" "}
              <span className="text-yellow-300">Bigger.</span>
            </p>
            <p className="text-sm md:text-base text-white/80 mt-2 max-w-lg drop-shadow">
              Explore exciting events, workshops, competitions and more
              happening on your campus.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Column */}
          <div className="flex-1 min-w-0">
            {/* Featured Events */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Featured Events
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[280px] rounded-2xl" />
                  ))}
                </div>
              ) : featuredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="featured"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No featured events at the moment.
                  </p>
                </div>
              )}
            </section>

            {/* Upcoming Events */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Events
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[300px] rounded-xl" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No upcoming events scheduled.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[300px] flex-shrink-0 space-y-5">
            {/* Welcome Card */}
            <Card className="shadow-sm border-gray-100">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👋</span>
                  </div>
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <h3 className="text-lg font-bold text-gray-900">
                    {profile?.full_name || "Student"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Here&apos;s what&apos;s happening on campus today.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? "-" : stats.registered}
                    </p>
                    <p className="text-[10px] text-gray-500">Registered</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? "-" : stats.upcoming}
                    </p>
                    <p className="text-[10px] text-gray-500">Upcoming</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? "-" : stats.completed}
                    </p>
                    <p className="text-[10px] text-gray-500">Completed</p>
                  </div>
                </div>

                <Button
                  className="w-full bg-maroon hover:bg-maroon-dark text-white"
                  onClick={() => {
                    document
                      .getElementById("upcoming-events")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Browse Events
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-maroon" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="flex gap-3 items-start text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-maroon mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 font-medium leading-tight">
                          {ann.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(ann.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No announcements yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <SrmsLogo className="mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} SRMS College of Engineering &
              Technology, Bareilly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
