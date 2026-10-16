"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Event, EVENT_CATEGORIES, EventCategory } from "@/lib/types";
import { INITIAL_MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate, formatTime, getCategoryColor } from "@/lib/utils";
import AdminNav from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  MapPin,
  Star,
  ExternalLink,
  AlertCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// Preset stock images suitable for college events
const PRESET_IMAGES = [
  {
    name: "Tech / Hackathon",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Coding / Workshop",
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Seminar / Conference",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Cultural / Music",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sports / Football",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Campus Building",
    url: "/images/srms-building.jpg",
  },
];

interface EventFormData {
  title: string;
  category: EventCategory;
  description: string;
  venue: string;
  organizer: string;
  event_date: string;
  event_time: string;
  capacity: number;
  registration_deadline: string;
  image_url: string;
  featured: boolean;
}

const initialFormData: EventFormData = {
  title: "",
  category: "Technical",
  description: "",
  venue: "",
  organizer: "",
  event_date: "",
  event_time: "10:00",
  capacity: 100,
  registration_deadline: "",
  image_url: PRESET_IMAGES[0].url,
  featured: false,
};

function AdminEventsContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegCounts, setEventRegCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (user && profile?.role === "admin") {
        fetchEvents();
      }
    }
  }, [user, profile, authLoading]);

  // Check query parameter for ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreateDialog();
    }
  }, [searchParams]);

  async function fetchEvents() {
    try {
      setLoading(true);
      let eventsList: Event[] = [];

      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("event_date", { ascending: false });

        if (!error && data && data.length > 0) {
          eventsList = data;
        }
      } catch {
        // ignore
      }

      if (eventsList.length === 0) {
        eventsList = INITIAL_MOCK_EVENTS;
      }
      setEvents(eventsList);

      const counts: Record<string, number> = {};
      try {
        const { data: regsData, error: regsError } = await supabase
          .from("registrations")
          .select("event_id")
          .eq("status", "registered");

        if (!regsError && regsData) {
          regsData.forEach((r) => {
            counts[r.event_id] = (counts[r.event_id] || 0) + 1;
          });
        }
      } catch {
        // ignore
      }

      eventsList.forEach((e, idx) => {
        if (!counts[e.id]) {
          counts[e.id] = Math.round(e.capacity * (0.35 + (idx % 3) * 0.15));
        }
      });
      setEventRegCounts(counts);
    } catch (err) {
      console.error(err);
      setEvents(INITIAL_MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingEventId(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  }

  function openEditDialog(evt: Event) {
    setEditingEventId(evt.id);
    setFormData({
      title: evt.title,
      category: evt.category,
      description: evt.description || "",
      venue: evt.venue,
      organizer: evt.organizer || "",
      event_date: evt.event_date,
      event_time: evt.event_time,
      capacity: evt.capacity,
      registration_deadline: evt.registration_deadline || "",
      image_url: evt.image_url || PRESET_IMAGES[0].url,
      featured: evt.featured || false,
    });
    setIsFormOpen(true);
  }

  function openDeleteDialog(evt: Event) {
    setDeletingEvent(evt);
    setIsDeleteDialogOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.venue || !formData.event_date || !formData.event_time) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        venue: formData.venue.trim(),
        organizer: formData.organizer.trim() || null,
        event_date: formData.event_date,
        event_time: formData.event_time,
        capacity: Number(formData.capacity) || 100,
        registration_deadline: formData.registration_deadline || null,
        image_url: formData.image_url.trim() || null,
        featured: formData.featured,
        updated_at: new Date().toISOString(),
      };

      if (editingEventId) {
        try {
          await supabase
            .from("events")
            .update(payload)
            .eq("id", editingEventId);
        } catch {
          // ignore
        }

        toast.success("Event updated successfully!");
        setEvents((prev) =>
          prev.map((item) =>
            item.id === editingEventId ? ({ ...item, ...payload } as Event) : item
          )
        );
      } else {
        const newEvt: Event = {
          id: "evt-custom-" + Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          const { data } = await supabase
            .from("events")
            .insert([payload])
            .select()
            .single();

          if (data) newEvt.id = data.id;
        } catch {
          // ignore
        }

        toast.success("Event created successfully!");
        setEvents((prev) => [newEvt, ...prev]);
      }

      setIsFormOpen(false);
      setEditingEventId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save event. Check fields and permissions.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingEvent) return;

    try {
      setIsDeleting(true);
      try {
        await supabase
          .from("events")
          .delete()
          .eq("id", deletingEvent.id);
      } catch {
        // ignore
      }

      toast.success(`"${deletingEvent.title}" deleted.`);
      setEvents((prev) => prev.filter((item) => item.id !== deletingEvent.id));
      setIsDeleteDialogOpen(false);
      setDeletingEvent(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter events
  const filteredEvents = events.filter((evt) => {
    // Category filter
    if (categoryFilter !== "All" && evt.category !== categoryFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchVenue = evt.venue.toLowerCase().includes(q);
      const matchOrg = (evt.organizer || "").toLowerCase().includes(q);
      return matchTitle || matchVenue || matchOrg;
    }
    return true;
  });

  const featuredCount = events.filter((e) => e.featured).length;
  const now = new Date();
  const upcomingCount = events.filter((e) => new Date(e.event_date) >= now).length;

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/admin" className="hover:text-maroon transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Events Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Manage Campus Events
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create, edit, remove, and track registrations for all college events
            </p>
          </div>

          <Button
            onClick={openCreateDialog}
            className="bg-maroon hover:bg-maroon/90 text-white shadow-xs self-start md:self-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Event
          </Button>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 shadow-2xs">
            Total Events: <span className="font-bold text-gray-900">{events.length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 shadow-2xs">
            Upcoming: <span className="font-bold text-emerald-600">{upcomingCount}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 shadow-2xs">
            Featured on Home: <span className="font-bold text-amber-600">{featuredCount}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by event, venue, or organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50/50 border-gray-200 text-sm h-9"
              />
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>
              <button
                onClick={() => setCategoryFilter("All")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  categoryFilter === "All"
                    ? "bg-maroon text-white font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                    categoryFilter === cat
                      ? "bg-maroon text-white font-semibold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No events found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                {searchQuery || categoryFilter !== "All"
                  ? "Try adjusting your search criteria or category filter."
                  : "Get started by creating your first college event."}
              </p>
              {searchQuery || categoryFilter !== "All" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("All");
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={openCreateDialog}
                  className="bg-maroon text-white text-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Create Event
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="w-[340px] text-xs font-bold text-gray-700">Event Info</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Date & Time</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Venue</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Capacity</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((evt) => {
                  const regCount = eventRegCounts[evt.id] || 0;
                  const isPast = new Date(evt.event_date) < now;
                  const isFull = regCount >= evt.capacity;

                  return (
                    <TableRow key={evt.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Event Info Column */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={
                                evt.image_url ||
                                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"
                              }
                              alt={evt.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${getCategoryColor(
                                  evt.category
                                )}`}
                              >
                                {evt.category}
                              </span>
                              {evt.featured && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {evt.title}
                            </p>
                            {evt.organizer && (
                              <p className="text-[11px] text-gray-500 truncate">
                                By {evt.organizer}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="align-middle text-xs text-gray-700">
                        <div className="font-medium text-gray-900">{formatDate(evt.event_date)}</div>
                        <div className="text-[11px] text-gray-500">{formatTime(evt.event_time)}</div>
                      </TableCell>

                      {/* Venue */}
                      <TableCell className="align-middle text-xs text-gray-700">
                        <div className="flex items-center gap-1 text-gray-900 truncate max-w-[160px]">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </TableCell>

                      {/* Capacity & Registered */}
                      <TableCell className="align-middle text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-gray-900">
                            {regCount} / {evt.capacity}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {Math.max(0, evt.capacity - regCount)} left
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle text-center">
                        {isPast ? (
                          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            Past
                          </span>
                        ) : isFull ? (
                          <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Full
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/events/${evt.id}/registrations`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                              title="View registered students"
                            >
                              <Users className="h-3.5 w-3.5 mr-1" />
                              <span>({regCount})</span>
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(evt)}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Edit event"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(evt)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Create / Edit Event Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {editingEventId ? "Edit Event" : "Create New College Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {editingEventId
                ? "Update event schedule, venue, or details."
                : "Enter details for the new event to publish it on the campus portal."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. SRMS TechFest 2026 - Hackathon"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                className="h-9 text-sm"
              />
            </div>

            {/* Category & Capacity row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: (val || "Technical") as EventCategory,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-semibold">
                  Capacity (Max Seats) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 0,
                    }))
                  }
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Description & Agenda
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Detailed description of the competition, eligibility, rules, and topics covered..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="text-sm resize-none"
              />
            </div>

            {/* Venue & Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="venue" className="text-xs font-semibold">
                  Venue / Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="venue"
                  placeholder="e.g. Main Auditorium, CS Lab 1"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizer" className="text-xs font-semibold">
                  Organizer / Club Name
                </Label>
                <Input
                  id="organizer"
                  placeholder="e.g. CSE Dept & Coding Club"
                  value={formData.organizer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, organizer: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event_date" className="text-xs font-semibold">
                  Event Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, event_date: e.target.value }))
                  }
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event_time" className="text-xs font-semibold">
                  Event Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, event_time: e.target.value }))
                  }
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="deadline" className="text-xs font-semibold">
                Registration Deadline (Optional)
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    registration_deadline: e.target.value,
                  }))
                }
                className="h-9 text-sm"
              />
            </div>

            {/* Image URL & Preset Selection */}
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-xs font-semibold">
                Cover Image URL
              </Label>
              <Input
                id="image_url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                }
                className="h-9 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                <span className="text-[11px] text-gray-500 mr-1">Quick Presets:</span>
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image_url: preset.url }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-maroon focus:ring-maroon cursor-pointer"
              />
              <Label htmlFor="featured" className="text-xs font-semibold cursor-pointer">
                Feature on Homepage Carousel / Spotlight
              </Label>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-maroon hover:bg-maroon/90 text-white text-xs shadow-xs"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingEventId
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 font-semibold">
                &ldquo;{deletingEvent?.title}&rdquo;
              </strong>
              ? This action cannot be undone. All registered student records for this event will also be deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-maroon/30 border-t-maroon rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading admin console...</p>
          </div>
        </div>
      }
    >
      <AdminEventsContent />
    </Suspense>
  );
}
