import { Event, Announcement, Profile, RegistrationWithEvent } from "./types";

export const DEMO_STUDENT: Profile = {
  id: "demo-student-uuid",
  full_name: "Rooshan",
  email: "rooshan@srms.ac.in",
  student_id: "2500140100077",
  department: "Computer Science & Engineering",
  year: "2nd Year",
  role: "student",
  created_at: new Date().toISOString(),
};

export const DEMO_ADMIN: Profile = {
  id: "demo-admin-uuid",
  full_name: "Prof. R. K. Sharma",
  email: "admin@srms.ac.in",
  student_id: "FAC-1002",
  department: "Event Organizing Committee",
  year: "Faculty",
  role: "admin",
  created_at: new Date().toISOString(),
};

export const INITIAL_MOCK_EVENTS: Event[] = [
  {
    id: "evt-techfest-2026",
    title: "TechFest 2026 - Annual Technical Symposium",
    description:
      "Join the biggest tech gathering of SRMS! Featuring competitive programming, robotics showdown, drone racing, and project exhibition with cash prizes worth ₹50,000.",
    category: "Technical",
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-10-15",
    event_time: "09:30",
    venue: "Main Auditorium",
    organizer: "CSE Department & Tech Club",
    capacity: 250,
    registration_deadline: "2026-10-12",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-cultural-night",
    title: "Cultural Night 2026 - Spandan",
    description:
      "A grand evening of music, classical & modern dance, musical bands, theatrical drama, and vibrant campus performances celebrating cultural diversity.",
    category: "Cultural",
    image_url:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-10-20",
    event_time: "17:00",
    venue: "Open Air Theatre",
    organizer: "Cultural Society",
    capacity: 500,
    registration_deadline: "2026-10-18",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-ai-future",
    title: "AI & the Future of Work - Expert Talk",
    description:
      "Distinguished keynote and panel discussion with senior industry leaders exploring Generative AI, machine intelligence careers, and practical steps for engineering students.",
    category: "Seminar",
    image_url:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-10-25",
    event_time: "11:00",
    venue: "Seminar Hall 1",
    organizer: "Training & Placement Cell",
    capacity: 180,
    registration_deadline: "2026-10-24",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-web-bootcamp",
    title: "Web Development Bootcamp: Full-Stack Next.js",
    description:
      "A fast-paced, hands-on workshop guiding students step-by-step to construct modern dynamic web applications with React, Next.js, and TypeScript.",
    category: "Workshop",
    image_url:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-11-05",
    event_time: "10:00",
    venue: "CS Lab 1",
    organizer: "Coding Club",
    capacity: 60,
    registration_deadline: "2026-11-03",
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-football-cup",
    title: "Inter-Department Football Championship",
    description:
      "Rep your department! Knockout tournament featuring 12 departmental teams battling for the annual SRMS rolling sports trophy.",
    category: "Sports",
    image_url:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-11-10",
    event_time: "15:30",
    venue: "College Football Ground",
    organizer: "Sports Department",
    capacity: 120,
    registration_deadline: "2026-11-08",
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-hackathon-2026",
    title: "SRMS 24-Hour Innovation Hackathon",
    description:
      "Build real-world solutions under 24 hours in healthcare, smart cities, and education technology. Mentorship from alumni and corporate partners.",
    category: "Competition",
    image_url:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80",
    event_date: "2026-11-18",
    event_time: "09:00",
    venue: "Innovation & Incubation Hub",
    organizer: "Innovation Cell & IEDC",
    capacity: 100,
    registration_deadline: "2026-11-15",
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Registrations for TechFest 2026 are now open!",
    description: "Limited seats available for workshop tracks. Register early to secure your spot.",
    created_at: new Date().toISOString(),
  },
  {
    id: "ann-2",
    title: "Cultural Night auditions this week.",
    description: "Auditions for music bands and dance troupes in SAC Room 204.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ann-3",
    title: "New workshop on Full-Stack Next.js announced.",
    description: "Certificate of participation will be provided by CSE department.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];
