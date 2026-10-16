-- ============================================
-- SRMS Events - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT,
  department TEXT,
  year TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition', 'Other')),
  image_url TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue TEXT NOT NULL,
  organizer TEXT,
  capacity INTEGER NOT NULL DEFAULT 100,
  registration_deadline TIMESTAMPTZ,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================
-- 4. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES POLICIES -----

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----- EVENTS POLICIES -----

-- Anyone authenticated can read events
CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Admins can create events
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update events
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete events
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----- REGISTRATIONS POLICIES -----

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create their own registrations
CREATE POLICY "Users can create own registrations"
  ON registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update (cancel) their own registrations
CREATE POLICY "Users can update own registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ----- ANNOUNCEMENTS POLICIES -----

-- Anyone authenticated can read announcements
CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

-- Admins can create announcements
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. HELPER FUNCTION: Get registration count
-- ============================================
CREATE OR REPLACE FUNCTION get_registration_count(event_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM registrations
  WHERE event_id = event_uuid AND status = 'registered';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 7. AUTO-UPDATE updated_at ON EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. SEED DATA
-- ============================================

-- Seed Announcements
INSERT INTO announcements (title, description) VALUES
  ('Registrations for TechFest 2026 are now open!', 'Sign up now to secure your spot in the biggest technical festival of the year.'),
  ('Cultural Night auditions this week.', 'Auditions for singing, dancing, and drama will be held in the auditorium.'),
  ('New workshop on AI & ML added.', 'A hands-on workshop covering machine learning basics has been scheduled.');

-- Seed Events
INSERT INTO events (title, description, category, event_date, event_time, venue, organizer, capacity, registration_deadline, featured, image_url) VALUES
  (
    'TechFest 2026',
    'The annual technical festival featuring coding competitions, robotics challenges, and tech talks from industry leaders. Join us for three days of innovation and learning.',
    'Technical',
    '2026-11-15',
    '10:00',
    'Main Auditorium',
    'CSE Department',
    200,
    '2026-11-10T23:59:59Z',
    TRUE,
    '/images/events/techfest.jpg'
  ),
  (
    'Cultural Night',
    'An evening of music, dance, and drama performances by talented students. Experience the rich cultural diversity of our campus community.',
    'Cultural',
    '2026-11-20',
    '18:00',
    'Open Air Theatre',
    'Cultural Committee',
    500,
    '2026-11-18T23:59:59Z',
    TRUE,
    '/images/events/cultural.jpg'
  ),
  (
    'AI & The Future of Work',
    'A seminar by industry experts discussing how artificial intelligence is reshaping careers and what students should prepare for. Interactive Q&A session included.',
    'Seminar',
    '2026-11-25',
    '14:00',
    'Seminar Hall',
    'IT Department',
    300,
    '2026-11-23T23:59:59Z',
    TRUE,
    '/images/events/ai-seminar.jpg'
  ),
  (
    'Web Development Bootcamp',
    'Hands-on workshop to build modern web applications using React, Next.js, and Tailwind CSS. Bring your laptop and learn by building a real project.',
    'Workshop',
    '2026-12-05',
    '09:00',
    'Lab 1',
    'Web Dev Club',
    50,
    '2026-12-03T23:59:59Z',
    FALSE,
    '/images/events/webdev.jpg'
  ),
  (
    'Inter-Department Football Tournament',
    'Show your skills and represent your department in the annual football tournament. Teams of 11 players can register. Trophies and certificates for winners.',
    'Sports',
    '2026-12-10',
    '07:00',
    'College Ground',
    'Sports Committee',
    200,
    '2026-12-08T23:59:59Z',
    FALSE,
    '/images/events/football.jpg'
  ),
  (
    'Hackathon 2026',
    '24-hour innovation challenge where teams compete to build creative solutions to real-world problems. Prizes worth ₹50,000 for the top three teams.',
    'Competition',
    '2026-12-18',
    '09:00',
    'Innovation Lab',
    'CSE Department',
    150,
    '2026-12-15T23:59:59Z',
    FALSE,
    '/images/events/hackathon.jpg'
  ),
  (
    'Career Guidance Seminar',
    'Insights from industry leaders and alumni on career planning, higher education options, and placement preparation. Networking session included.',
    'Seminar',
    '2026-12-22',
    '11:00',
    'Seminar Hall',
    'Placement Cell',
    300,
    '2026-12-20T23:59:59Z',
    FALSE,
    '/images/events/career.jpg'
  );
