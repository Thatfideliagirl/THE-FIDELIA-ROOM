// Seed/mock data and small pure helpers shared across the app.

export const ADMIN_EMAIL = "fidelia@fjroom.com";

export const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,500&family=Work+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .lms-root { font-family:'Work Sans',sans-serif; background:#FAF6EC; color:#262019; --accent:#1C6FA0; font-size:16px; }
  .f-display { font-family:'Fraunces',serif; }
  .f-label { font-family:'Work Sans',sans-serif; font-weight:700; letter-spacing:.07em; }
  .f-code { font-family:'IBM Plex Mono',monospace; letter-spacing:.03em; }
  .lms-root * { box-sizing:border-box; }
  @keyframes riseIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .reveal { opacity:0; } .reveal.in { animation: riseIn .85s cubic-bezier(.22,1,.36,1) both; }
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
      { id: 2, title: "Skills Self-Assessment & Growth Plan", brief: "Map what you already have and what to build next.", notes: "Before you can pitch yourself, you need a clear map of what you already bring and where the gaps are.", videoUrl: "", slideUrl: "", testType: "written", markingGuide: "Look for: a specific skill list, at least one honest gap, and a concrete next step." },
      { id: 3, title: "Essential Productivity Tools", brief: "Calendars, docs, and task boards you'll use daily.", notes: "Google Workspace, Notion, and task boards like Trello or Asana form the backbone of a VA's daily toolkit.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "Which tool is best for shared, real-time document editing?", options: ["Google Docs", "A printed notebook", "Email attachments"], correct: 0 }, { q: "What's the main benefit of a task board like Trello?", options: ["It looks nice", "Visualizing work status across a team", "It replaces email entirely"], correct: 1 }] },
      { id: 4, title: "Professional Support Tasks for VAs", brief: "Inbox, calendar, and admin work done right.", notes: "Inbox triage, calendar management, and travel coordination are core VA deliverables.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "What's the first step in inbox triage?", options: ["Delete everything", "Sort by urgency and sender", "Reply to every email immediately"], correct: 1 }] },
      { id: 5, title: "AI for VAs", brief: "Tools that save real hours, used responsibly.", notes: "AI tools can save hours on drafting, summarizing, and research — but they need oversight.", videoUrl: "", slideUrl: "", testType: "file-upload", proofType: "document", markingGuide: "Accept PDF or DOCX only. Look for a completed AI-assisted workflow writeup." },
      { id: 6, title: "Building Your Professional Presence", brief: "Resume, pitch, and cover letter that land interviews.", notes: "Your resume, pitch, and portfolio are what get you noticed.", videoUrl: "", slideUrl: "", testType: "written", markingGuide: "Look for a clear, specific pitch tailored to one niche." },
      { id: 7, title: "Finding Your First Client", brief: "Where real clients are, and how to reach them.", notes: "Most first clients come from warm outreach and niche communities, not cold job boards.", videoUrl: "", slideUrl: "", testType: "multiple-choice", passPct: 70, quiz: [{ q: "Which is usually the strongest source of a first client?", options: ["Cold job board applications only", "Your existing network and warm referrals", "Paid ads"], correct: 1 }] },
      { id: 8, title: "Mock Project, Portfolio & Next Steps", brief: "A real case study for your portfolio.", notes: "You'll complete one full mock project end-to-end and turn it into a portfolio case study.", videoUrl: "", slideUrl: "", testType: "file-upload", proofType: "document", markingGuide: "Accept PDF, DOCX, or a shared link. Look for a complete before/after case study." },
    ],
  },
  { id: "cs", title: "Content Creation & Strategy", tagline: "Plan, create, and grow with real strategy.", audience: "Freelancers building a content-led business", description: "Plan, create, and grow with real strategy, not guesswork.", level: "Intermediate", durationWeeks: 6, status: "live", image: null, outcomes: ["Build a content strategy from scratch", "Plan a month of content in an afternoon"], applicationQuestions: ["Have you managed a brand's content before?", "Which platforms are you focused on?", "What's your main content goal right now?"], testimonialIds: ["te2"], modules: [{ id: 1, title: "Understanding Content", brief: "What makes content actually work.", notes: "We start with what content is really for, before touching a single platform.", videoUrl: "", slideUrl: "", testType: "checklist" }] },
];

export const seedCohorts = [
  { id: "diamond", name: "Diamond Cohort", startDate: "2026-01-06", endDate: "2026-06-30", status: "active", courseIds: ["va", "cs"] },
];

export const seedApplicants = [
  { id: "ap1", name: "Chidi Okafor", email: "chidi@example.com", phone: "0803 555 1122", courseId: "va", cohortId: "diamond", studentRef: null, answers: ["No, this would be my first time.", "Yes, I have a laptop and steady internet.", "I've used Google Docs a little.", "I want a flexible way to earn from home.", "Saw a post from a friend on Instagram."], status: "pending" },
];

export const seedStudents = [
  { id: "s1", studentId: "FJ/2026/001", name: "Amara Chukwu", email: "amara@example.com", cohortId: "diamond", photo: null, seenTour: true, accountStatus: "active",
    enrollments: [{ id: "e1", courseId: "va", code: "FJ-4KD9M", status: "active", completedModuleIds: [1, 2, 3], certificateReady: false, certificateFile: null }] },
  { id: "s2", studentId: "FJ/2026/002", name: "Tobi Fashola", email: "tobi@example.com", cohortId: "diamond", photo: null, seenTour: true, accountStatus: "active",
    enrollments: [{ id: "e2", courseId: "va", code: "FJ-7RN2Q", status: "active", completedModuleIds: [1], certificateReady: false, certificateFile: null }] },
  { id: "s3", studentId: "FJ/2026/003", name: "Ngozi Eze", email: "ngozi@example.com", cohortId: "diamond", photo: null, seenTour: false, accountStatus: "active",
    enrollments: [{ id: "e3", courseId: "va", code: "FJ-9WZ5T", status: "awaiting-code", completedModuleIds: [], certificateReady: false, certificateFile: null }] },
];

export const seedResources = [
  { id: "r1", courseId: "va", folder: "Module 1 resources", title: "VA industry overview", description: "A quick map of common VA niches — what each involves and who it suits.", type: "Doc", url: "https://docs.google.com", kind: "link", visibility: "course", isPublic: false },
  { id: "r3", courseId: "va", folder: "Free downloads", title: "Weekly Planning Template", description: "Plan your working week in one page, built for VA workloads.", type: "Doc", url: "https://docs.google.com", kind: "file", visibility: "all", isPublic: true },
];

export const seedTasks = [
  { id: "t1", courseId: "va", title: "Reach out to 3 potential clients", description: "Send a short, genuine intro message to 3 people in your network.", tools: "LinkedIn or WhatsApp, your intro template from Module 6", proofType: "link", dueInDays: 7, assigned: ["s1"], submissions: {} },
  { id: "t2", courseId: "va", title: "Set up your calendar tool", description: "Have a working Calendly (or similar) link ready.", tools: "Calendly, Google Calendar", proofType: "link", dueInDays: 3, assigned: ["s1", "s2"], submissions: { s1: { status: "approved", note: "Calendly link shared", score: 100 } } },
];

export const seedTestimonials = [
  { id: "te1", name: "Larry O.", quote: "Fidelia doesn't just teach — she checks that you actually got it before you move on." },
  { id: "te2", name: "Victoria A.", quote: "I came in nervous about tech tools. Left with a client and a system I actually understand." },
  { id: "te3", name: "Faith I.", quote: "Got my first client three weeks after finishing module seven." },
];
export const seedFaqs = [
  { id: "f1", q: "Do I need previous experience before applying?", a: "No — most courses are built for beginners." },
  { id: "f2", q: "How do I apply for a course?", a: "Applying and signing up happen in one step." },
  { id: "f4", q: "How do I receive my access code?", a: "Once approved, keep an eye on your email." },
  { id: "f5", q: "Will I get a certificate?", a: "Yes, once you complete every module." },
];

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
