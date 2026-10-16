"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { RegistrationWithEvent } from "@/lib/types";
import { INITIAL_MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate, formatTime, getCategoryColor } from "@/lib/utils";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Search,
  CalendarX,
  History,
  Ticket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type TabType = "all" | "upcoming" | "past" | "cancelled";

export default function MyRegistrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingEventTitle, setCancellingEventTitle] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchRegistrations();
    }
  }, [user, authLoading]);

  async function fetchRegistrations() {
    try {
      setLoading(true);
      let regsData: RegistrationWithEvent[] = [];

      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("*, events(*)")
          .eq("user_id", user!.id)
          .order("registered_at", { ascending: false });

        if (!error && data && data.length > 0) {
          regsData = data as RegistrationWithEvent[];
        }
      } catch {
        // network or supabase not configured
      }

      if (regsData.length === 0) {
        // Use demo registrations
        regsData = [
          {
            id: "reg-demo-1",
            user_id: user!.id,
            event_id: INITIAL_MOCK_EVENTS[0].id,
            status: "registered",
            registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            events: INITIAL_MOCK_EVENTS[0],
          },
          {
            id: "reg-demo-2",
            user_id: user!.id,
            event_id: INITIAL_MOCK_EVENTS[1].id,
            status: "registered",
            registered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            events: INITIAL_MOCK_EVENTS[1],
          },
          {
            id: "reg-demo-3",
            user_id: user!.id,
            event_id: INITIAL_MOCK_EVENTS[3].id,
            status: "registered",
            registered_at: new Date(Date.now() - 86400000 * 7).toISOString(),
            events: INITIAL_MOCK_EVENTS[3],
          },
        ];
      }

      setRegistrations(regsData);
    } catch (err) {
      console.error(err);
      setRegistrations([
        {
          id: "reg-demo-1",
          user_id: user!.id,
          event_id: INITIAL_MOCK_EVENTS[0].id,
          status: "registered",
          registered_at: new Date().toISOString(),
          events: INITIAL_MOCK_EVENTS[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function openCancelModal(regId: string, eventTitle: string) {
    setCancellingId(regId);
    setCancellingEventTitle(eventTitle);
    setIsCancelDialogOpen(true);
  }

  async function handleConfirmCancel() {
    if (!cancellingId || !user) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from("registrations")
        .update({ status: "cancelled" })
        .eq("id", cancellingId)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to cancel registration: " + error.message);
        return;
      }

      toast.success("Registration cancelled successfully.");

      // Update state locally
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === cancellingId ? { ...reg, status: "cancelled" } : reg
        )
      );
      setIsCancelDialogOpen(false);
      setCancellingId(null);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while cancelling.");
    } finally {
      setIsProcessing(false);
    }
  }

  const now = new Date();

  // Statistics
  const totalCount = registrations.length;
  const activeRegs = registrations.filter((r) => r.status === "registered");
  const upcomingCount = activeRegs.filter(
    (r) => r.events && new Date(r.events.event_date) >= now
  ).length;
  const pastCount = activeRegs.filter(
    (r) => r.events && new Date(r.events.event_date) < now
  ).length;
  const cancelledCount = registrations.filter((r) => r.status === "cancelled").length;

  // Filtered registrations
  const filteredRegistrations = registrations.filter((reg) => {
    if (!reg.events) return false;
    const eventDate = new Date(reg.events.event_date);
    const isUpcomingEvent = eventDate >= now;

    // Tab filter
    if (activeTab === "upcoming" && (reg.status !== "registered" || !isUpcomingEvent)) {
      return false;
    }
    if (activeTab === "past" && (reg.status !== "registered" || isUpcomingEvent)) {
      return false;
    }
    if (activeTab === "cancelled" && reg.status !== "cancelled") {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = reg.events.title.toLowerCase().includes(q);
      const matchesVenue = reg.events.venue.toLowerCase().includes(q);
      const matchesCategory = reg.events.category.toLowerCase().includes(q);
      return matchesTitle || matchesVenue || matchesCategory;
    }

    return true;
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-maroon/30 border-t-maroon rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/" className="hover:text-maroon transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">My Registrations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              My Registrations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Keep track of your registered college events, schedules, and passes
            </p>
          </div>

          <Link href="/">
            <Button className="bg-maroon hover:bg-maroon/90 text-white shadow-sm">
              <Ticket className="h-4 w-4 mr-2" />
              Explore More Events
            </Button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                <p className="text-xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Upcoming</p>
                <p className="text-xl font-bold text-gray-900">{upcomingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="text-xl font-bold text-gray-900">{pastCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                <CalendarX className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">{cancelledCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/80 overflow-x-auto w-full sm:w-auto">
            {(
              [
                { id: "all", label: "All", count: totalCount },
                { id: "upcoming", label: "Upcoming", count: upcomingCount },
                { id: "past", label: "Past", count: pastCount },
                { id: "cancelled", label: "Cancelled", count: cancelledCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-gray-100 text-gray-800"
                      : "bg-gray-200/60 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search registrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200 text-sm h-9"
            />
          </div>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-4 border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="w-full sm:w-48 h-32 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50 py-16 text-center">
            <CardContent className="max-w-md mx-auto flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-maroon/10 text-maroon flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {searchQuery
                  ? "No matching registrations"
                  : activeTab === "all"
                  ? "You haven't registered for any events yet"
                  : `No ${activeTab} registrations`}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchQuery
                  ? "Try checking your spelling or clearing the search filter."
                  : "Discover exciting college competitions, technical workshops, and cultural fests happening at SRMS."}
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="text-xs"
                >
                  Clear Search
                </Button>
              ) : (
                <Link href="/">
                  <Button className="bg-maroon hover:bg-maroon/90 text-white">
                    Explore Events
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((reg) => {
              const event = reg.events;
              const isPast = new Date(event.event_date) < now;
              const isCancelled = reg.status === "cancelled";
              const canCancel = !isPast && !isCancelled;

              return (
                <Card
                  key={reg.id}
                  className={`border-gray-200 bg-white transition-all hover:shadow-md ${
                    isCancelled ? "opacity-70 bg-gray-50/50" : ""
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-48 h-36 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={
                            event.image_url ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80"
                          }
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${getCategoryColor(
                              event.category
                            )}`}
                          >
                            {event.category}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {isCancelled ? (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 text-xs py-0.5"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelled
                              </Badge>
                            ) : isPast ? (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-200 text-xs py-0.5"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-gray-500" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Confirmed
                              </Badge>
                            )}

                            <span className="text-xs text-gray-500">
                              Registered {formatDate(reg.registered_at)}
                            </span>
                          </div>

                          <span className="text-xs font-mono text-gray-400">
                            ID: {reg.id.slice(0, 8)}
                          </span>
                        </div>

                        <Link
                          href={`/events/${event.id}`}
                          className="group inline-block"
                        >
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-maroon transition-colors line-clamp-1">
                            {event.title}
                          </h3>
                        </Link>

                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1 mb-3">
                            {event.description}
                          </p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatDate(event.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatTime(event.event_time)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span>{event.venue}</span>
                          </div>
                          {event.organizer && (
                            <div className="text-gray-500">
                              Org: <span className="font-medium text-gray-700">{event.organizer}</span>
                            </div>
                          )}
                        </div>

                        {/* Card actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Link href={`/events/${event.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-medium"
                              >
                                View Event Details
                                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </Link>
                          </div>

                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCancelModal(reg.id, event.title)}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancel Registration
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Dialog for Cancellation */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle>Cancel Event Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration for{" "}
              <strong className="text-gray-900 font-semibold">
                &ldquo;{cancellingEventTitle}&rdquo;
              </strong>
              ? This action will free your seat for other students.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Keep Registration
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isProcessing}
            >
              {isProcessing ? "Cancelling..." : "Yes, Cancel Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
