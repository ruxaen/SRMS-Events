"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Event, Profile, Registration } from "@/lib/types";
import { INITIAL_MOCK_EVENTS, DEMO_STUDENT } from "@/lib/mock-data";
import { formatDate, formatTime, getCategoryColor } from "@/lib/utils";
import AdminNav from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Clock,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface RecentRegistration {
  id: string;
  status: "registered" | "cancelled";
  registered_at: string;
  events: Event;
  profiles: Profile;
}

const MOCK_RECENT_REGISTRATIONS: RecentRegistration[] = [
  {
    id: "rec-1",
    status: "registered",
    registered_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    events: INITIAL_MOCK_EVENTS[0],
    profiles: {
      id: "std-1",
      full_name: "Rooshan",
      email: "rooshan@srms.ac.in",
      student_id: "2500140100077",
      department: "CSE",
      year: "2nd Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "rec-2",
    status: "registered",
    registered_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    events: INITIAL_MOCK_EVENTS[1],
    profiles: {
      id: "std-2",
      full_name: "Ananya Verma",
      email: "ananya.v@srms.ac.in",
      student_id: "2400140100021",
      department: "IT",
      year: "3rd Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "rec-3",
    status: "registered",
    registered_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    events: INITIAL_MOCK_EVENTS[3],
    profiles: {
      id: "std-3",
      full_name: "Kartik Saxena",
      email: "kartik.s@srms.ac.in",
      student_id: "2300140100045",
      department: "ECE",
      year: "4th Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "rec-4",
    status: "cancelled",
    registered_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    events: INITIAL_MOCK_EVENTS[4],
    profiles: {
      id: "std-4",
      full_name: "Sneha Patel",
      email: "sneha.p@srms.ac.in",
      student_id: "2500140100112",
      department: "ME",
      year: "1st Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "rec-5",
    status: "registered",
    registered_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    events: INITIAL_MOCK_EVENTS[5],
    profiles: {
      id: "std-5",
      full_name: "Amit Kumar",
      email: "amit.k@srms.ac.in",
      student_id: "2400140100098",
      department: "MCA",
      year: "2nd Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
];

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
  const [eventRegCounts, setEventRegCounts] = useState<Record<string, number>>({});
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalRegsCount, setTotalRegsCount] = useState(0);
  const [confirmedRegsCount, setConfirmedRegsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (profile && profile.role !== "admin") {
        toast.error("Unauthorized: Admin access required.");
        router.push("/");
        return;
      }
      fetchDashboardData();
    }
  }, [user, profile, authLoading]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      let fetchedEvents: Event[] = [];

      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .order("event_date", { ascending: true });

        if (!eventsError && eventsData && eventsData.length > 0) {
          fetchedEvents = eventsData;
        }
      } catch {
        // network or supabase not configured
      }

      if (fetchedEvents.length === 0) {
        fetchedEvents = INITIAL_MOCK_EVENTS;
      }
      setEvents(fetchedEvents);

      // Registration counts
      let confirmedCount = 0;
      let totalCount = 0;
      const countMap: Record<string, number> = {};

      try {
        const { data: allRegs, error: regsError } = await supabase
          .from("registrations")
          .select("id, event_id, status");

        if (!regsError && allRegs && allRegs.length > 0) {
          totalCount = allRegs.length;
          const confirmed = allRegs.filter((r) => r.status === "registered");
          confirmedCount = confirmed.length;
          confirmed.forEach((r) => {
            countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
          });
        }
      } catch {
        // ignore
      }

      if (confirmedCount === 0) {
        // mock count distribution
        fetchedEvents.forEach((e, idx) => {
          countMap[e.id] = Math.round(e.capacity * (0.3 + (idx % 3) * 0.2));
          confirmedCount += countMap[e.id];
        });
        totalCount = confirmedCount + 12;
      }

      setTotalRegsCount(totalCount);
      setConfirmedRegsCount(confirmedCount);
      setEventRegCounts(countMap);

      // Student count
      let stdCount = 0;
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student");

        if (!error && count) stdCount = count;
      } catch {
        // ignore
      }
      setTotalStudentsCount(stdCount || 248);

      // Recent registrations
      let recent: RecentRegistration[] = [];
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("id, status, registered_at, events(*), profiles(*)")
          .order("registered_at", { ascending: false })
          .limit(8);

        if (!error && data && data.length > 0) {
          recent = data as unknown as RecentRegistration[];
        }
      } catch {
        // ignore
      }

      if (recent.length === 0) {
        recent = MOCK_RECENT_REGISTRATIONS;
      }
      setRecentRegistrations(recent);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      setEvents(INITIAL_MOCK_EVENTS);
      setRecentRegistrations(MOCK_RECENT_REGISTRATIONS);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= now);
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

  if (authLoading || (!user && !authLoading) || (profile && profile.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-maroon/30 border-t-maroon rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-maroon/10 text-maroon">
                Administration Panel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Events Overview & Control
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor active registrations, manage college events, and oversee campus participation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/events?action=new">
              <Button className="bg-maroon hover:bg-maroon/90 text-white shadow-xs">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </Link>
            <Link href="/admin/events">
              <Button variant="outline" className="border-gray-200">
                Manage Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Events */}
          <Card className="border-gray-200 bg-white shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Events
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{events.length}</div>
              )}
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="text-blue-600 font-semibold">{upcomingEvents.length}</span> upcoming / active
              </p>
            </CardContent>
          </Card>

          {/* Confirmed Registrations */}
          <Card className="border-gray-200 bg-white shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Registrations
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{confirmedRegsCount}</div>
              )}
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="text-gray-700 font-semibold">{totalRegsCount}</span> total entries recorded
              </p>
            </CardContent>
          </Card>

          {/* Enrolled Students */}
          <Card className="border-gray-200 bg-white shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Registered Students
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{totalStudentsCount}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Accounts on the platform</p>
            </CardContent>
          </Card>

          {/* Capacity Utilization */}
          <Card className="border-gray-200 bg-white shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Seats Available
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {Math.max(0, totalCapacity - confirmedRegsCount)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Across {totalCapacity} total seat quota
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout: Upcoming Events & Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upcoming Events List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    Upcoming Events
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Schedule and live capacity tracking
                  </p>
                </div>
                <Link href="/admin/events">
                  <Button variant="ghost" size="sm" className="text-xs text-maroon hover:text-maroon/90">
                    View All ({events.length})
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No upcoming events scheduled.
                    <div className="mt-3">
                      <Link href="/admin/events?action=new">
                        <Button size="sm" className="bg-maroon text-white text-xs">
                          Create an Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {upcomingEvents.slice(0, 5).map((evt) => {
                      const regCount = eventRegCounts[evt.id] || 0;
                      const percent = evt.capacity > 0 ? Math.round((regCount / evt.capacity) * 100) : 0;

                      return (
                        <div
                          key={evt.id}
                          className="p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(
                                  evt.category
                                )}`}
                              >
                                {evt.category}
                              </span>
                              {evt.featured && (
                                <Badge variant="outline" className="text-[10px] py-0 border-amber-300 text-amber-700 bg-amber-50">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {evt.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(evt.event_date)} at {formatTime(evt.event_time)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {evt.venue}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-900">
                                {regCount} / {evt.capacity}
                              </p>
                              <p className="text-[10px] text-gray-500">{percent}% filled</p>
                            </div>
                            <Link href={`/admin/events/${evt.id}/registrations`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 text-gray-700 hover:text-maroon"
                              >
                                Attendees
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recent Registrations Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    Latest Registrations
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real-time student sign-ups
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                  {recentRegistrations.length} recent
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                  </div>
                ) : recentRegistrations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No registrations recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                    {recentRegistrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-3.5 hover:bg-gray-50/80 transition-colors flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {reg.profiles?.full_name || "Student"}
                          </p>
                          <p className="text-gray-500 text-[11px] truncate">
                            {reg.profiles?.department || "Dept"} &bull; {reg.profiles?.student_id || reg.profiles?.email}
                          </p>
                          <p className="text-maroon font-medium truncate mt-0.5">
                            {reg.events?.title}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          {reg.status === "registered" ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatDate(reg.registered_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
