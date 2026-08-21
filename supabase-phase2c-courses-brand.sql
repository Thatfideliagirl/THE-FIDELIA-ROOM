-- Phase 2c: move courses and branding/admin-profile out of local mock state
-- into Supabase, so edits made on one device show up everywhere (including
-- the deployed site on a phone) instead of only in the browser tab that
-- made them.

-- The very first schema created a `courses` table (and modules/meetings/
-- enrollments/tasks tables riding on it) for a fully relational design that
-- was never actually adopted -- the app has used local/jsonb state for all
-- of these instead from the start. Nothing in the app queries any of them,
-- so they're safe to clear out before creating the real `courses` table
-- this app actually uses.
drop table if exists meetings cascade;
drop table if exists modules cascade;
drop table if exists enrollments cascade;
drop table if exists tasks cascade;
drop table if exists courses cascade;

create table if not exists courses (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table courses disable row level security;

create table if not exists site_settings (
  id text primary key default 'main',
  brand jsonb not null,
  admin_profile jsonb not null,
  updated_at timestamptz default now()
);
alter table site_settings disable row level security;

-- Seed the two courses that already exist as local mock data, so the
-- courses index doesn't go empty the moment the app switches to reading
-- from this table.
insert into courses (id, data) values
('va', '{
  "title": "Virtual Assistant Foundations", "tagline": "From zero to your first paid client.",
  "audience": "Aspiring VAs ready to land their first client",
  "description": "Eight modules that take a beginner from zero to booking real client work.",
  "level": "Beginner", "durationWeeks": 8, "status": "live", "image": null,
  "outcomes": ["Run inbox & calendar systems like a pro", "Use AI tools responsibly to save real hours", "Land and onboard your first client", "Build a real portfolio piece"],
  "applicationQuestions": ["Have you done any virtual assistant or admin support work before?", "Do you have reliable access to a laptop and internet?", "Have you used tools like Google Workspace or Notion before?", "What''s your main reason for wanting to take this course?", "Who referred you to FJ Room, if anyone?"],
  "testimonialIds": ["te1", "te3"],
  "modules": [
    { "id": 1, "title": "Introduction to the VA World", "brief": "What VAs actually do, and where the work lives.", "notes": "Virtual assistance covers a wide range of remote support work — inbox management, scheduling, research, content support, and more.", "videoUrl": "", "slideUrl": "", "testType": "checklist" },
    { "id": 2, "title": "Skills Self-Assessment & Growth Plan", "brief": "Map what you already have and what to build next.", "notes": "Before you can pitch yourself, you need a clear map of what you already bring and where the gaps are.", "videoUrl": "", "slideUrl": "", "testType": "written", "questionPrompt": "List 3 skills you already have, 1 honest gap, and one concrete next step to close it.", "markingGuide": "Look for: a specific skill list, at least one honest gap, and a concrete next step." },
    { "id": 3, "title": "Essential Productivity Tools", "brief": "Calendars, docs, and task boards you''ll use daily.", "notes": "Google Workspace, Notion, and task boards like Trello or Asana form the backbone of a VA''s daily toolkit.", "videoUrl": "", "slideUrl": "", "testType": "multiple-choice", "passPct": 70, "quiz": [{ "q": "Which tool is best for shared, real-time document editing?", "options": ["Google Docs", "A printed notebook", "Email attachments"], "correct": 0 }, { "q": "What''s the main benefit of a task board like Trello?", "options": ["It looks nice", "Visualizing work status across a team", "It replaces email entirely"], "correct": 1 }] },
    { "id": 4, "title": "Professional Support Tasks for VAs", "brief": "Inbox, calendar, and admin work done right.", "notes": "Inbox triage, calendar management, and travel coordination are core VA deliverables.", "videoUrl": "", "slideUrl": "", "testType": "multiple-choice", "passPct": 70, "quiz": [{ "q": "What''s the first step in inbox triage?", "options": ["Delete everything", "Sort by urgency and sender", "Reply to every email immediately"], "correct": 1 }], "meetings": [{ "id": "mt1", "label": "Tuesday live class", "date": "2026-02-10T17:00", "link": "https://meet.google.com/fj-room-va-tue" }, { "id": "mt2", "label": "Thursday live class", "date": "2026-02-12T17:00", "link": "https://meet.google.com/fj-room-va-thu" }] },
    { "id": 5, "title": "AI for VAs", "brief": "Tools that save real hours, used responsibly.", "notes": "AI tools can save hours on drafting, summarizing, and research — but they need oversight.", "videoUrl": "", "slideUrl": "", "testType": "file-upload", "proofType": "document", "questionPrompt": "Upload a PDF or DOCX walking through one AI-assisted workflow you used this week.", "markingGuide": "Accept PDF or DOCX only. Look for a completed AI-assisted workflow writeup." },
    { "id": 6, "title": "Building Your Professional Presence", "brief": "Resume, pitch, and cover letter that land interviews.", "notes": "Your resume, pitch, and portfolio are what get you noticed.", "videoUrl": "", "slideUrl": "", "testType": "written", "markingGuide": "Look for a clear, specific pitch tailored to one niche." },
    { "id": 7, "title": "Finding Your First Client", "brief": "Where real clients are, and how to reach them.", "notes": "Most first clients come from warm outreach and niche communities, not cold job boards.", "videoUrl": "", "slideUrl": "", "testType": "multiple-choice", "passPct": 70, "quiz": [{ "q": "Which is usually the strongest source of a first client?", "options": ["Cold job board applications only", "Your existing network and warm referrals", "Paid ads"], "correct": 1 }] },
    { "id": 8, "title": "Mock Project, Portfolio & Next Steps", "brief": "A real case study for your portfolio.", "notes": "You''ll complete one full mock project end-to-end and turn it into a portfolio case study.", "videoUrl": "", "slideUrl": "", "testType": "file-upload", "proofType": "document", "markingGuide": "Accept PDF, DOCX, or a shared link. Look for a complete before/after case study." }
  ]
}'::jsonb),
('cs', '{
  "title": "Content Creation & Strategy", "tagline": "Plan, create, and grow with real strategy.",
  "audience": "Freelancers building a content-led business",
  "description": "Plan, create, and grow with real strategy, not guesswork.",
  "level": "Intermediate", "durationWeeks": 6, "status": "live", "image": null,
  "outcomes": ["Build a content strategy from scratch", "Plan a month of content in an afternoon"],
  "applicationQuestions": ["Have you managed a brand''s content before?", "Which platforms are you focused on?", "What''s your main content goal right now?"],
  "testimonialIds": ["te2"],
  "modules": [{ "id": 1, "title": "Understanding Content", "brief": "What makes content actually work.", "notes": "We start with what content is really for, before touching a single platform.", "videoUrl": "", "slideUrl": "", "testType": "checklist" }]
}'::jsonb)
on conflict (id) do nothing;

insert into site_settings (id, brand, admin_profile) values (
  'main',
  '{"name": "FJ Room", "accent": "#1C6FA0", "email": "FJRoomm@gmail.com", "whatsapp": "2348135793935", "instagram": "VA_WEY_DEY_PAMPER", "twitter": "VA_WeyDeyPamper"}'::jsonb,
  '{"name": "Fidelia Joseph", "photo": null, "bio": ""}'::jsonb
)
on conflict (id) do nothing;
