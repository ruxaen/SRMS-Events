// Database types for SRMS Events

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  department: string | null;
  year: string | null;
  role: "student" | "admin";
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: "Technical" | "Cultural" | "Sports" | "Workshop" | "Seminar" | "Competition" | "Other";
  image_url: string | null;
  event_date: string;
  event_time: string;
  venue: string;
  organizer: string | null;
  capacity: number;
  registration_deadline: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: "registered" | "cancelled";
  registered_at: string;
}

export interface RegistrationWithEvent extends Registration {
  events: Event;
}

export interface RegistrationWithProfile extends Registration {
  profiles: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export type EventCategory = Event["category"];

export const EVENT_CATEGORIES: EventCategory[] = [
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Competition",
  "Other",
];
