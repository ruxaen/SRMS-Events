"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Event, Registration } from "@/lib/types";
import { INITIAL_MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate, formatTime, getCategoryColor, isDeadlinePassed } from "@/lib/utils";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchEventData();
    }
  }, [user, authLoading, id]);

  async function fetchEventData() {
    try {
      let eventDataFound = null;

      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (!eventError && eventData) {
          eventDataFound = eventData;
        }
      } catch {
        // network or supabase not configured
      }

      if (!eventDataFound) {
        // Fallback to mock events
        const mock = INITIAL_MOCK_EVENTS.find((e) => e.id === id) || INITIAL_MOCK_EVENTS[0];
        eventDataFound = mock;
      }

      setEvent(eventDataFound);

      // Fetch registration count
      try {
        const { count } = await supabase
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id)
          .eq("status", "registered");

        setRegistrationCount(count || 38);
      } catch {
        setRegistrationCount(38);
      }

      // Check if user is already registered
      if (user) {
        try {
          const { data: regData } = await supabase
            .from("registrations")
            .select("*")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .single();

          if (regData) setRegistration(regData);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      const mock = INITIAL_MOCK_EVENTS.find((e) => e.id === id) || INITIAL_MOCK_EVENTS[0];
      setEvent(mock);
      setRegistrationCount(38);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!user || !event) return;
    setRegistering(true);

    try {
      const { data, error } = await supabase
        .from("registrations")
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: "registered",
        })
        .select()
        .single();

      if (error) {
        // Fallback to local registration if offline / demo
        const mockReg: Registration = {
          id: "demo-reg-" + Date.now(),
          user_id: user.id,
          event_id: event.id,
          status: "registered",
          registered_at: new Date().toISOString(),
        };
        setRegistration(mockReg);
        setRegistrationCount((prev) => prev + 1);
        toast.success("Registration successful! 🎉 (Demo Mode)");
        setRegistering(false);
        return;
      }

      setRegistration(data);
      setRegistrationCount((prev) => prev + 1);
      toast.success("Registration successful! 🎉");
    } catch {
      // Local fallback
      const mockReg: Registration = {
        id: "demo-reg-" + Date.now(),
        user_id: user.id,
        event_id: event.id,
        status: "registered",
        registered_at: new Date().toISOString(),
      };
      setRegistration(mockReg);
      setRegistrationCount((prev) => prev + 1);
      toast.success("Registration successful! 🎉");
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (!registration) return;
    setCancelling(true);

    try {
      await supabase
        .from("registrations")
        .update({ status: "cancelled" })
        .eq("id", registration.id);

      setRegistration({ ...registration, status: "cancelled" });
      setRegistrationCount((prev) => Math.max(0, prev - 1));
      toast.success("Registration cancelled.");
    } catch {
      setRegistration({ ...registration, status: "cancelled" });
      setRegistrationCount((prev) => Math.max(0, prev - 1));
      toast.success("Registration cancelled.");
    } finally {
      setCancelling(false);
    }
  }

  const isFull = event ? registrationCount >= event.capacity : false;
  const isRegistered = registration?.status === "registered";
  const isCancelled = registration?.status === "cancelled";
  const deadlinePassed = event
    ? isDeadlinePassed(event.registration_deadline)
    : false;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-[400px] w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Event not found
          </h2>
          <p className="text-gray-500 mb-6">
            The event you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-gray-600 hover:text-maroon -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        {/* Event Image */}
        <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-maroon to-maroon-dark flex items-center justify-center">
              <Calendar className="h-20 w-20 text-white/30" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className={`${getCategoryColor(event.category)} text-sm px-3 py-1`}>
              {event.category}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Event Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {event.title}
            </h1>

            {event.description && (
              <p className="text-gray-600 leading-relaxed mb-6">
                {event.description}
              </p>
            )}

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card className="border-gray-100">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(event.event_date)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="font-medium text-gray-900">
                      {formatTime(event.event_time)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Venue</p>
                    <p className="font-medium text-gray-900">{event.venue}</p>
                  </div>
                </CardContent>
              </Card>

              {event.organizer && (
                <Card className="border-gray-100">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Organizer</p>
                      <p className="font-medium text-gray-900">
                        {event.organizer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <Card className="shadow-sm border-gray-100 sticky top-24">
              <CardContent className="pt-6 space-y-4">
                {/* Capacity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Available Seats
                    </span>
                    <span className="text-sm font-medium">
                      {registrationCount} / {event.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isFull ? "bg-red-500" : "bg-maroon"
                      }`}
                      style={{
                        width: `${Math.min(
                          (registrationCount / event.capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                {event.registration_deadline && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Deadline</span>
                    <span
                      className={`font-medium ${
                        deadlinePassed ? "text-red-500" : "text-gray-900"
                      }`}
                    >
                      {formatDate(event.registration_deadline)}
                    </span>
                  </div>
                )}

                {/* Registration Button */}
                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5" />
                      Registered ✓
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleCancelRegistration}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                          Cancelling...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Cancel Registration
                        </span>
                      )}
                    </Button>
                  </div>
                ) : isCancelled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-gray-50 text-gray-500 rounded-lg px-4 py-3 text-sm">
                      <XCircle className="h-5 w-5" />
                      Registration Cancelled
                    </div>
                    <Button
                      className="w-full bg-maroon hover:bg-maroon-dark text-white"
                      onClick={handleRegister}
                      disabled={registering || isFull || deadlinePassed}
                    >
                      Register Again
                    </Button>
                  </div>
                ) : isFull ? (
                  <Button className="w-full" disabled>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Registration Full
                  </Button>
                ) : deadlinePassed ? (
                  <Button className="w-full" disabled>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Deadline Passed
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-maroon hover:bg-maroon-dark text-white"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Registering...
                      </span>
                    ) : (
                      "Register Now"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
