-- ============================================================
-- FJ Room — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once on a fresh project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- SITE-WIDE SETTINGS
-- ============================================================

create table brand_settings (
  id int primary key default 1,
  name text not null default 'FJ Room',
  accent text not null default '#1C6FA0',
  constraint brand_settings_single_row check (id = 1)
);
insert into brand_settings (id) values (1);

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text unique not null,
  photo_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MARKETING CONTENT
-- ============================================================

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quote text not null,
  created_at timestamptz not null default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0
);

-- ============================================================
-- COHORTS
-- ============================================================

create table cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'active', -- active | archived
  course_ids uuid[] not null default '{}',           -- courses available to this cohort
  unlocked_course_ids uuid[] not null default '{}',   -- of those, which have lectures unlocked
  created_at timestamptz not null default now()
);

-- ============================================================
-- COURSES, MODULES, MEETINGS
-- ============================================================

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tagline text,
  audience text,
  description text,
  level text,                 -- Beginner | Intermediate | Advanced
  duration_weeks int,
  status text not null default 'draft', -- draft | live
  image_url text,
  outcomes jsonb not null default '[]',              -- ["outcome 1", "outcome 2"]
  application_questions jsonb not null default '[]', -- ["question 1", ...]
  testimonial_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  position int not null default 0,   -- display order within the course
  title text not null,
  brief text,                        -- shown first, "before you start"
  notes text,                        -- lecture content
  video_url text,
  slide_url text,
  slide_file_url text,
  test_type text not null default 'checklist', -- multiple-choice | written | file-upload | checklist | milestone
  pass_pct int default 70,
  proof_type text,                   -- document | link | image
  marking_guide text,                -- key points, also used for auto-check
  question_prompt text,              -- the actual question/brief shown to students
  quiz jsonb not null default '[]',  -- [{ q, options: [...], correct: idx }]
  created_at timestamptz not null default now()
);
create index modules_course_id_idx on modules(course_id);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  label text not null,
  starts_at timestamptz,
  link text,
  recording_link text,
  recording_file_url text,
  created_at timestamptz not null default now()
);
create index meetings_module_id_idx on meetings(module_id);

-- ============================================================
-- STUDENTS, ENROLLMENTS, APPLICANTS
-- ============================================================

create table students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  student_code text unique not null,  -- e.g. FJ/2026/001
  name text not null,
  email text unique not null,
  cohort_id uuid references cohorts(id) on delete set null,
  photo_url text,
  bio text,
  seen_tour boolean not null default false,
  account_status text not null default 'active', -- active | inactive | suspended
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  code text not null,                 -- redemption code
  status text not null default 'awaiting-code', -- awaiting-code | active
  completed_module_ids uuid[] not null default '{}',
  pending_review jsonb,                -- { moduleId, proof, submittedAt, autoScore } or null
  certificate_ready boolean not null default false,
  certificate_file_url text,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table applicants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  course_id uuid references courses(id) on delete set null,
  cohort_id uuid references cohorts(id) on delete set null,
  student_ref uuid references students(id) on delete set null, -- set if an existing student applying for another course
  answers jsonb not null default '[]',
  status text not null default 'pending', -- pending | accepted | declined
  created_at timestamptz not null default now()
);

-- ============================================================
-- RESOURCES
-- ============================================================

create table resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade, -- null = general/free resource
  folder text not null,
  title text not null,
  description text,
  type text,                 -- Doc | Sheet | Slides | Link
  kind text not null default 'link', -- link | file
  url text,
  file_url text,
  visibility text not null default 'course', -- course | all
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  tools text,
  proof_type text,           -- link | document | text
  due_in_days int,
  assigned_student_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null default 'in review', -- in review | approved | rejected
  note text,
  score int,
  submitted_at timestamptz not null default now(),
  unique (task_id, student_id)
);

-- ============================================================
-- COMMUNITY
-- ============================================================

create table community_posts (
  id uuid primary key default gen_random_uuid(),
  author_student_id uuid references students(id) on delete set null,
  author_name text not null,
  text text,
  image_url text,
  created_at timestamptz not null default now()
);

create table community_likes (
  post_id uuid not null references community_posts(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (post_id, student_id)
);

create table community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTICE BOARD
-- ============================================================

create table notices (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  cohort_id uuid references cohorts(id) on delete cascade, -- null = all cohorts
  created_at timestamptz not null default now()
);

create table notice_seen (
  notice_id uuid not null references notices(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (notice_id, student_id)
);

-- ============================================================
-- DIRECT MESSAGES (student <-> admin)
-- ============================================================

create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  sender text not null check (sender in ('student', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);
create index direct_messages_student_id_idx on direct_messages(student_id);

-- ============================================================
-- Row Level Security — enable now, policies added when auth is wired up.
-- Until then, the app will connect using the service role key from the
-- server side only (never exposed to the browser).
-- ============================================================

alter table students enable row level security;
alter table enrollments enable row level security;
alter table task_submissions enable row level security;
alter table direct_messages enable row level security;
alter table applicants enable row level security;
