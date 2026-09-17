// Seed/mock data and small pure helpers shared across the app.

export const ADMIN_EMAIL = "fjroomm@gmail.com";

// The full set of admin tabs a team member's access can be built from.
// "profile" and "team" are deliberately excluded -- profile is always
// available (it's their own account), and managing the roster itself
// stays owner-only, matching the SQL policies on team_members.
export const TEAM_PERMISSION_TABS = [
  { group: "Content", items: [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Courses" },
    { id: "cohorts", label: "Cohorts" },
    { id: "library", label: "Library" },
    { id: "meetings", label: "Virtual Meetings" },
  ] },
  { group: "People", items: [
    { id: "applicants", label: "Applicants" },
    { id: "students", label: "Students" },
    { id: "gradebook", label: "Gradebook" },
    { id: "tasks", label: "Tasks" },
  ] },
  { group: "Community", items: [
    { id: "certificates", label: "Certificates" },
    { id: "testimonials", label: "Testimonials" },
    { id: "faq", label: "FAQ" },
    { id: "chat", label: "Chat" },
    { id: "community", label: "Community" },
    { id: "notice", label: "Notice Board" },
  ] },
  { group: "Settings", items: [
    { id: "branding", label: "Branding" },
  ] },
];


export const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,500&family=Work+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .lms-root { font-family:'Work Sans',sans-serif; background:#FAF6EC; color:#262019; --accent:#1C6FA0; font-size:16px; }
  .f-display { font-family:'Fraunces',serif; }
  .f-label { font-family:'Work Sans',sans-serif; font-weight:700; letter-spacing:.07em; }
  .f-code { font-family:'IBM Plex Mono',monospace; letter-spacing:.03em; }
  .lms-root * { box-sizing:border-box; }
  @keyframes riseIn { from{opacity:0;transform:translateY(24px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  .reveal { opacity:0; } .reveal.in { animation: riseIn .6s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes growLine { from{transform:scaleY(0)} to{transform:scaleY(1)} }
  .grow-line { transform-origin:top; animation:growLine 1.1s cubic-bezier(.22,1,.36,1) both; }
  @keyframes softPulse { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--accent) 30%, transparent)} 50%{box-shadow:0 0 0 9px color-mix(in srgb, var(--accent) 0%, transparent)} }
  .pulse-ring { animation: softPulse 2.4s ease-in-out infinite; }
  @keyframes bellRing { 0%,100%{transform:rotate(0)} 10%{transform:rotate(14deg)} 20%{transform:rotate(-12deg)} 30%{transform:rotate(9deg)} 40%{transform:rotate(-6deg)} 50%{transform:rotate(0)} }
  .bell-ring { animation: bellRing 2.2s ease-in-out infinite; transform-origin: top center; }
  @keyframes helpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(28,111,160,.35)} 50%{box-shadow:0 0 0 12px rgba(28,111,160,0)} }
  .help-pulse { animation: helpPulse 2.6s ease-in-out infinite; }
  .btn-primary { background:var(--accent); color:#FAF6EC; transition:all .18s ease; box-shadow:0 10px 22px -10px color-mix(in srgb, var(--accent) 70%, transparent); }
  .btn-primary:hover { filter:brightness(1.12); transform:translateY(-2px) scale(1.02); }
  .btn-primary:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
  .btn-primary:disabled:hover { filter:none; transform:none; }
  .btn-ghost { border:1.5px solid #262019; color:#262019; transition:all .18s ease; }
  .btn-ghost:hover { background:#262019; color:#FAF6EC; transform:translateY(-2px); }
  .btn-soft { background:color-mix(in srgb, var(--accent) 14%, white); color:var(--accent); transition:all .18s ease; }
  .btn-soft:hover { background:color-mix(in srgb, var(--accent) 24%, white); transform:translateY(-2px); }
  .tint-badge { background:color-mix(in srgb, var(--accent) 14%, white); color:var(--accent); }
  .accent-text { color:var(--accent); }
  .node-line-done { background:var(--accent); }
  .node-line-locked { background: repeating-linear-gradient(to bottom,#C9BFAE 0,#C9BFAE 4px,transparent 4px,transparent 9px); }
  .card { background:#FFFFFF; border:1px solid #E7DEC9; }
  .card-pop { transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease; }
  .card-pop:hover { transform: translateY(-5px) scale(1.015); box-shadow: 0 26px 46px -22px rgba(38,32,25,.28); }
  .input-field { background:#FFFFFF; border:1px solid #D8CDB4; font-family:'Work Sans',sans-serif; width:100%; font-size:15px; }
  .input-field:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
  .book-tab { border-left:4px solid var(--accent); }
  .side-active { background:color-mix(in srgb, var(--accent) 14%, white); color:var(--accent); }
  @keyframes modalIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .modal-in { animation: modalIn .3s cubic-bezier(.22,1,.36,1) both; }
  .progress-track { background:#F0E7D6; border-radius:99px; overflow:hidden; }
  .progress-fill { background:var(--accent); height:100%; border-radius:99px; transition:width .5s ease; }
  .rich-content h1, .rich-content h2, .rich-content h3 { font-family:'Fraunces',serif; font-weight:800; margin:18px 0 10px; }
  .rich-content h1 { font-size:22px; } .rich-content h2 { font-size:20px; } .rich-content h3 { font-size:18px; }
  .rich-content p { margin:0 0 12px; } .rich-content p:empty { min-height:12px; }
  .rich-content ul, .rich-content ol { margin:0 0 12px; padding-left:22px; }
  .rich-content ul { list-style-type:disc; } .rich-content ol { list-style-type:decimal; }
  .rich-content ul ul { list-style-type:circle; } .rich-content ol ol { list-style-type:lower-alpha; }
  .rich-content li { display:list-item; }
  .rich-content li { margin-bottom:4px; }
  .rich-content blockquote { margin:0 0 12px; padding:2px 16px; border-left:3px solid var(--accent); color:#71675A; font-style:italic; }
  .rich-content > *:first-child { margin-top:0; }
  .rich-content .rt-figure { margin:16px 0; }
  .rich-content .rt-figure img { max-width:100%; max-height:420px; border-radius:10px; display:block; }
  .rich-content .rt-figure figcaption { font-size:13px; color:#71675A; margin-top:6px; font-style:italic; }
`;

// ---------------- data ----------------
export const seedCourses = [
  {
    id: "va", title: "Virtual Assistant Foundations", tagline: "From zero to your first paid client.",
    audience: "Aspiring VAs ready to land their first client",
    description: "Eight modules that take a beginner from zero to booking real client work.",
    level: "Beginner", durationWeeks: 8, status: "live", image: null,
    outcomes: ["Run inbox & calendar systems like a pro", "Use AI tools responsibly to save real hours", "Land and onboard your first client", "Build a real portfolio piece"],
    applicationQuestions: ["Have you done any virtual assistant or admin support work before?", "Do you have reliable access to a laptop and internet?", "Have you used tools like Google Workspace or Notion before?", "What's your main reason for wanting to take this course?", "Who referred you to FJ Room, if anyone?"],
    testimonialIds: ["te1", "te3"],
    modules: [
      { id: 1, title: "Introduction to the VA World", brief: "What VAs actually do, and where the work lives.", notes: "Virtual assistance covers a wide range of remote support work — inbox management, scheduling, research, content support, and more.", videoUrl: "", slideUrl: "", testType: "checklist" },
      { id: 2, title: "Skills Self-Assessment & Growth Plan", brief: "Map what you already have and what to build next.", notes: "Before you can pitch yourself, you need a clear map of what you already bring and where the gaps are.", videoUrl: "", slideUrl: "", testType: "written", questionPrompt: "List 3 skills you already have, 1 honest gap, and one concrete next step to close it.", markingGuide: "Look for: a specific skill list, at least one honest gap, and a concrete next step." },
      { id: 3, title: "Essential Productivity Tools", brief: "Calendars, docs, and task boards you'll use daily.", notes: "Google Workspace, Notion, and task boards like Trello or Asana form the backbone of a VA's daily toolkit.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "Which tool is best for shared, real-time document editing?", options: ["Google Docs", "A printed notebook", "Email attachments"], correct: 0 }, { q: "What's the main benefit of a task board like Trello?", options: ["It looks nice", "Visualizing work status across a team", "It replaces email entirely"], correct: 1 }] },
      { id: 4, title: "Professional Support Tasks for VAs", brief: "Inbox, calendar, and admin work done right.", notes: "Inbox triage, calendar management, and travel coordination are core VA deliverables.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "What's the first step in inbox triage?", options: ["Delete everything", "Sort by urgency and sender", "Reply to every email immediately"], correct: 1 }], meetings: [{ id: "mt1", label: "Tuesday live class", date: "2026-02-10T17:00", link: "https://meet.google.com/fj-room-va-tue" }, { id: "mt2", label: "Thursday live class", date: "2026-02-12T17:00", link: "https://meet.google.com/fj-room-va-thu" }] },
      { id: 5, title: "AI for VAs", brief: "Tools that save real hours, used responsibly.", notes: "AI tools can save hours on drafting, summarizing, and research — but they need oversight.", videoUrl: "", slideUrl: "", testType: "file-upload", proofType: "document", questionPrompt: "Upload a PDF or DOCX walking through one AI-assisted workflow you used this week.", markingGuide: "Accept PDF or DOCX only. Look for a completed AI-assisted workflow writeup." },
      { id: 6, title: "Building Your Professional Presence", brief: "Resume, pitch, and cover letter that land interviews.", notes: "Your resume, pitch, and portfolio are what get you noticed.", videoUrl: "", slideUrl: "", testType: "written", markingGuide: "Look for a clear, specific pitch tailored to one niche." },
      { id: 7, title: "Finding Your First Client", brief: "Where real clients are, and how to reach them.", notes: "Most first clients come from warm outreach and niche communities, not cold job boards.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "Which is usually the strongest source of a first client?", options: ["Cold job board applications only", "Your existing network and warm referrals", "Paid ads"], correct: 1 }] },
      { id: 8, title: "Mock Project, Portfolio & Next Steps", brief: "A real case study for your portfolio.", notes: "You'll complete one full mock project end-to-end and turn it into a portfolio case study.", videoUrl: "", slideUrl: "", testType: "file-upload", proofType: "document", markingGuide: "Accept PDF, DOCX, or a shared link. Look for a complete before/after case study." },
    ],
  },
  { id: "cs", title: "Content Creation & Strategy", tagline: "Plan, create, and grow with real strategy.", audience: "Freelancers building a content-led business", description: "Plan, create, and grow with real strategy, not guesswork.", level: "Intermediate", durationWeeks: 6, status: "live", image: null, outcomes: ["Build a content strategy from scratch", "Plan a month of content in an afternoon"], applicationQuestions: ["Have you managed a brand's content before?", "Which platforms are you focused on?", "What's your main content goal right now?"], testimonialIds: ["te2"], modules: [{ id: 1, title: "Understanding Content", brief: "What makes content actually work.", notes: "We start with what content is really for, before touching a single platform.", videoUrl: "", slideUrl: "", testType: "checklist" }] },
];

export const seedCohorts = [
  { id: "diamond", name: "Diamond Cohort", startDate: "2026-01-06", endDate: "2026-06-30", status: "active", courseIds: ["va", "cs"], unlockedCourseIds: ["va"] },
];

export const seedApplicants = [];

export const seedStudents = [];

export const seedResources = [
  { id: "r1", courseId: "va", folder: "Module 1 resources", title: "VA industry overview", description: "A quick map of common VA niches — what each involves and who it suits.", type: "Doc", url: "https://docs.google.com", file: null, kind: "link", visibility: "course", isPublic: false },
  { id: "r3", courseId: "va", folder: "Free downloads", title: "Weekly Planning Template", description: "Plan your working week in one page, built for VA workloads.", type: "Doc", url: "https://docs.google.com", file: null, kind: "link", visibility: "all", isPublic: true },
];

export const seedTasks = [
  { id: "t1", courseId: "va", title: "Reach out to 3 potential clients", description: "Send a short, genuine intro message to 3 people in your network.", tools: "LinkedIn or WhatsApp, your intro template from Module 6", proofType: "link", dueInDays: 7, assigned: [], submissions: {} },
  { id: "t2", courseId: "va", title: "Set up your calendar tool", description: "Have a working Calendly (or similar) link ready.", tools: "Calendly, Google Calendar", proofType: "link", dueInDays: 3, assigned: [], submissions: {} },
];

export const seedTestimonials = [
  { id: "te1", name: "Larry O.", quote: "Fidelia doesn't just teach — she checks that you actually got it before you move on." },
  { id: "te2", name: "Victoria A.", quote: "I came in nervous about tech tools. Left with a client and a system I actually understand." },
  { id: "te3", name: "Faith I.", quote: "Got my first client three weeks after finishing module seven." },
];
export const seedFaqs = [
  { id: "f1", q: "Do I need previous experience before applying?", a: "No — most courses are built for beginners." },
  { id: "f2", q: "How do I apply for a course?", a: "Applying and signing up happen in one step." },
  { id: "f4", q: "How do I receive my access code?", a: "Once approved, keep an eye on your email — check spam too, just in case." },
  { id: "f5", q: "Will I get a certificate?", a: "Yes, once you complete every module." },
];

export const AUTO_APPROVE_THRESHOLD = 60;
const GRADING_STOPWORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "that", "this", "is", "are", "was", "were", "be", "at", "as", "it", "your", "you", "from", "by", "their", "them", "will", "should", "look", "accept", "only", "not", "least"]);
// Crude keyword-overlap heuristic scoring a free-text submission against the admin's marking guide.
// Not real understanding-based grading — used to auto-approve clear matches and route the rest to manual review.
export function scoreSubmission(text, markingGuide) {
  const guideWords = [...new Set(((markingGuide || "").toLowerCase().match(/[a-z][a-z'-]{3,}/g)) || [])].filter((w) => !GRADING_STOPWORDS.has(w));
  if (guideWords.length === 0) return { pct: 0, matched: [], missed: [], total: 0 };
  const lowerText = (text || "").toLowerCase();
  const matched = guideWords.filter((w) => lowerText.includes(w));
  const missed = guideWords.filter((w) => !lowerText.includes(w));
  return { pct: Math.round((matched.length / guideWords.length) * 100), matched, missed, total: guideWords.length };
}
export function genCode() { const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let out = "FJ-"; for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)]; return out; }
export function nextStudentId(students) { return `FJ/2026/${String(students.length + 1).padStart(3, "0")}`; }
export function moduleStatus(course, enrollment, moduleId) {
  const ids = course.modules.map((m) => m.id);
  const idx = ids.indexOf(moduleId);
  const doneCount = enrollment.completedModuleIds.length;
  if (enrollment.completedModuleIds.includes(moduleId)) return "complete";
  if (idx === doneCount) return "current";
  return "locked";
}
export function pairKey(a, b) { return [a, b].sort().join("__"); }

// ---------------- shared ----------------
