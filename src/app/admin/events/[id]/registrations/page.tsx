"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Event, Profile, Registration } from "@/lib/types";
import { INITIAL_MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate, formatTime, getCategoryColor } from "@/lib/utils";
import AdminNav from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

interface RegistrationItem {
  id: string;
  status: "registered" | "cancelled";
  registered_at: string;
  profiles: Profile;
}

const MOCK_ATTENDEES: RegistrationItem[] = [
  {
    id: "att-1",
    status: "registered",
    registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profiles: {
      id: "std-1",
      full_name: "Rooshan",
      email: "rooshan@srms.ac.in",
      student_id: "2500140100077",
      department: "Computer Science & Engineering",
      year: "2nd Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "att-2",
    status: "registered",
    registered_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    profiles: {
      id: "std-2",
      full_name: "Ananya Verma",
      email: "ananya.v@srms.ac.in",
      student_id: "2400140100021",
      department: "Information Technology",
      year: "3rd Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "att-3",
    status: "registered",
    registered_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    profiles: {
      id: "std-3",
      full_name: "Kartik Saxena",
      email: "kartik.s@srms.ac.in",
      student_id: "2300140100045",
      department: "Electronics & Communication",
      year: "4th Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "att-4",
    status: "cancelled",
    registered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    profiles: {
      id: "std-4",
      full_name: "Sneha Patel",
      email: "sneha.p@srms.ac.in",
      student_id: "2500140100112",
      department: "Mechanical Engineering",
      year: "1st Year",
      role: "student",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "att-5",
    status: "registered",
    registered_at: new Date(Date.now() - 86400000 * 6).toISOString(),
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

export default function EventRegistrationsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "registered" | "cancelled">("all");

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
      fetchEventAndRegistrations();
    }
  }, [user, profile, authLoading, id]);

  async function fetchEventAndRegistrations() {
    try {
      setLoading(true);

      let eventItem: Event | null = null;
      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (!eventError && eventData) {
          eventItem = eventData;
        }
      } catch {
        // ignore
      }

      if (!eventItem) {
        eventItem = INITIAL_MOCK_EVENTS.find((e) => e.id === id) || INITIAL_MOCK_EVENTS[0];
      }
      setEvent(eventItem);

      let list: RegistrationItem[] = [];
      try {
        const { data: regsData, error: regsError } = await supabase
          .from("registrations")
          .select("id, status, registered_at, profiles(*)")
          .eq("event_id", id)
          .order("registered_at", { ascending: true });

        if (!regsError && regsData && regsData.length > 0) {
          list = regsData as unknown as RegistrationItem[];
        }
      } catch {
        // ignore
      }

      if (list.length === 0) {
        list = MOCK_ATTENDEES;
      }
      setRegistrations(list);
    } catch (err) {
      console.error(err);
      setEvent(INITIAL_MOCK_EVENTS[0]);
      setRegistrations(MOCK_ATTENDEES);
    } finally {
      setLoading(false);
    }
  }

  // Filter registrations
  const filteredRegs = registrations.filter((reg) => {
    // Status filter
    if (statusFilter !== "all" && reg.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const p = reg.profiles;
      const matchName = (p?.full_name || "").toLowerCase().includes(q);
      const matchEmail = (p?.email || "").toLowerCase().includes(q);
      const matchId = (p?.student_id || "").toLowerCase().includes(q);
      const matchDept = (p?.department || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchId || matchDept;
    }
    return true;
  });

  const confirmedCount = registrations.filter((r) => r.status === "registered").length;
  const cancelledCount = registrations.filter((r) => r.status === "cancelled").length;

  function exportCSV() {
    if (!event || registrations.length === 0) {
      toast.error("No attendees to export.");
      return;
    }

    const headers = [
      "Sl No",
      "Full Name",
      "Roll No / Student ID",
      "Email",
      "Department",
      "Year",
      "Registration Date",
      "Status",
    ];

    const rows = filteredRegs.map((r, index) => [
      index + 1,
      `"${r.profiles?.full_name || ""}"`,
      `"${r.profiles?.student_id || ""}"`,
      `"${r.profiles?.email || ""}"`,
      `"${r.profiles?.department || ""}"`,
      `"${r.profiles?.year || ""}"`,
      `"${formatDate(r.registered_at)}"`,
      `"${r.status.toUpperCase()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_attendees.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendee list exported as CSV.");
  }

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
    <div className="min-h-screen bg-gray-50/50 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-maroon transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/events" className="hover:text-maroon transition-colors">
            Events Management
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Attendee Roster</span>
        </div>

        {/* Event Header Banner Card */}
        {loading || !event ? (
          <Skeleton className="h-40 w-full rounded-xl mb-8" />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getCategoryColor(
                      event.category
                    )}`}
                  >
                    {event.category}
                  </span>
                  {event.featured && (
                    <Badge variant="outline" className="text-[10px] py-0 border-amber-300 text-amber-700 bg-amber-50">
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {event.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-maroon" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-maroon" />
                    <span>{formatTime(event.event_time)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-maroon" />
                    <span>{event.venue}</span>
                  </div>
                  {event.organizer && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-maroon" />
                      <span>{event.organizer}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Roster Metrics & Actions */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-500 font-medium">Capacity Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {confirmedCount} / {event.capacity}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {Math.max(0, event.capacity - confirmedCount)} seats available
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    className="text-xs shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export CSV
                  </Button>
                  <Link href={`/events/${event.id}`} target="_blank">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-maroon"
                    >
                      View Live Page
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control & Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by student name, roll no, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50/50 border-gray-200 text-sm h-9"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-maroon text-white font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({registrations.length})
              </button>
              <button
                onClick={() => setStatusFilter("registered")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "registered"
                    ? "bg-maroon text-white font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "cancelled"
                    ? "bg-maroon text-white font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>
        </div>

        {/* Student Attendees Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : filteredRegs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No attendees found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try clearing your search query or switching status filters."
                  : "No students have registered for this event yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-bold text-gray-700">#</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Student Name</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Roll No / ID</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Department & Year</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Registered On</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegs.map((reg, idx) => {
                  const p = reg.profiles;
                  const isRegistered = reg.status === "registered";

                  return (
                    <TableRow key={reg.id} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell className="text-center text-xs text-gray-500 font-mono">
                        {idx + 1}
                      </TableCell>

                      <TableCell className="align-middle">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                          {p?.full_name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{p?.email}</span>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle text-xs font-mono font-medium text-gray-800">
                        {p?.student_id || "N/A"}
                      </TableCell>

                      <TableCell className="align-middle text-xs text-gray-700">
                        <div>{p?.department || "Unassigned"}</div>
                        <div className="text-[11px] text-gray-500">{p?.year || ""}</div>
                      </TableCell>

                      <TableCell className="align-middle text-xs text-gray-600">
                        {formatDate(reg.registered_at)}
                      </TableCell>

                      <TableCell className="align-middle text-center">
                        {isRegistered ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 text-xs py-0.5"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
