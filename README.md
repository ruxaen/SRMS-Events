# SRMS Events

A college event registration portal for **SRMS College of Engineering & Technology, Bareilly**. Students can discover campus events, register for them, and manage their registrations. Administrators can create and manage events while monitoring participation.

## Features

### Student portal

- Sign up and sign in with Supabase authentication
- Browse featured and upcoming events
- View event details, venue, capacity, and registration deadline
- Register for events or cancel an existing registration
- Review registrations by upcoming, past, and cancelled status
- View campus announcements and a personal registration summary

### Admin portal

- Dashboard with event, student, registration, and capacity metrics
- Create, edit, and delete events
- View event-specific registrations and export attendee data as CSV
- Track recent registrations and event capacity

### Demo-ready experience

The application includes one-click student and administrator demo access. It also supplies mock data when Supabase is unavailable, so the main workflows can be explored without backend configuration.

## Tech stack

- [Next.js](https://nextjs.org/) 16 with React 19 and TypeScript
- Tailwind CSS 4 and shadcn/ui components
- [Supabase](https://supabase.com/) for authentication and data
- Lucide icons and Sonner notifications

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project (optional for demo mode)

### Installation

```bash
git clone https://github.com/ruxaen/SRMSevents.git
cd SRMSevents
npm install
```

Copy the environment template and add your Supabase project credentials:

```bash
copy .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Apply [supabase-schema.sql](./supabase-schema.sql) in the Supabase SQL Editor to create the tables and row-level security policies.

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |

## Project structure

```text
src/
  app/          # Student, authentication, and admin routes
  components/   # Shared UI and navigation components
  context/      # Authentication and demo-session state
  lib/          # Supabase client, types, utilities, and mock data
public/         # SRMS branding and event imagery
supabase-schema.sql  # Database schema and RLS policies
```

## Roles

- **Students** can browse events, register, cancel registrations, and view their history.
- **Administrators** can manage events and access registration reporting.

For a live deployment, ensure each authenticated user has a corresponding `profiles` record and set authorized staff accounts to `role = 'admin'`.
