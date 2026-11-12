import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { SectionHeader } from "./components.jsx";
import { scanPictures, cleanPictures, formatBytes, getIn, setIn } from "./lib/photoCleanup.js";

const PART_NAMES = { image: "Course picture", certificateTemplate: "Certificate template", photo: "Photo", testimonialTemplate: "Testimonial card template", idCardTemplate: "ID card template", file: "Uploaded file", certificateFile: "Certificate file" };
function describe(sourceLabel, path) {
  const names = path.map(String).filter((p) => PART_NAMES[p]);
  const part = names.length ? PART_NAMES[names[0]] : "Picture";
  return { title: sourceLabel, part };
}

// Everything the owner can see, with a way to swap one picture's link for
// its smaller copy. Each swap goes through the app's normal saving, and only
// happens if the picture is still the one that was scanned.
export function PhotoCleanupTab({ courses, setCourses, students, setStudents, testimonials, setTestimonials, brand, setBrand, adminProfile, setAdminProfile, resources, onEditResource, community, setCommunity, tasks, setTasks }) {
  const [phase, setPhase] = useState("idle"); // idle | scanning | found | cleaning | done
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState([0, 0]);
  const [result, setResult] = useState(null);

  function buildSources() {
    const list = [];
    const guard = (setter, matchId) => (path, oldUrl, newUrl) => setter((prev) => prev.map((x) => x.id === matchId && getIn(x, path) === oldUrl ? setIn(x, path, newUrl) : x));
    (courses || []).forEach((c) => list.push({ label: c.title || "Course", value: c, replace: guard(setCourses, c.id) }));
    (students || []).forEach((s) => list.push({ label: s.name || "Student", value: s, replace: guard(setStudents, s.id) }));
    (testimonials || []).forEach((t) => list.push({ label: t.name || "Testimonial", value: t, replace: guard(setTestimonials, t.id) }));
    (community || []).forEach((p) => list.push({ label: "Community post", value: p, replace: guard(setCommunity, p.id) }));
    (tasks || []).forEach((t) => list.push({ label: t.title || "Task", value: t, replace: guard(setTasks, t.id) }));
    (resources || []).forEach((r) => list.push({ label: r.title || "Library resource", value: r, replace: (path, oldUrl, newUrl) => { if (getIn(r, path) === oldUrl) onEditResource(r.id, setIn(r, path, newUrl)); } }));
    list.push({ label: "Site branding", value: brand, replace: (path, oldUrl, newUrl) => setBrand((b) => getIn(b, path) === oldUrl ? setIn(b, path, newUrl) : b) });
    list.push({ label: "Your profile", value: adminProfile, replace: (path, oldUrl, newUrl) => setAdminProfile((p) => getIn(p, path) === oldUrl ? setIn(p, path, newUrl) : p) });
    return list;
  }

  async function scan() {
    setPhase("scanning"); setResult(null);
    try { setItems(await scanPictures(buildSources())); setPhase("found"); }
    catch (e) { console.error("photo scan failed", e); setItems([]); setPhase("found"); }
  }
  async function clean() {
    setPhase("cleaning"); setProgress([0, 1]);
    const r = await cleanPictures(items, (d, t) => setProgress([d, t]));
    setResult(r); setItems([]); setPhase("done");
  }

  const total = items.reduce((n, i) => n + i.bytes, 0);
  return (
    <>
      <SectionHeader eyebrow="KEEP THE SITE FAST" title="Photo Cleanup" />
      <div className="card rounded-2xl p-6 mb-5 max-w-[720px]">
        <div className="text-[14.5px]" style={{ color: "#4A4338", lineHeight: 1.6 }}>Big pictures make the site slow, especially on phones. This looks through your course pictures, certificate templates, testimonials, student photos and library, and shows you the heavy ones. Press <strong>Clean up</strong> and they're shrunk — they look the same, they just load much faster.</div>
        {(phase === "idle" || phase === "done") && <button onClick={scan} className="btn-primary rounded-lg px-6 py-2.5 text-[14px] mt-4 flex items-center gap-2"><Sparkles size={15} /> {phase === "done" ? "Scan again" : "Scan for big pictures"}</button>}
        {phase === "scanning" && <div className="text-[14px] mt-4" style={{ color: "#71675A" }}>Looking through everything… this can take a moment.</div>}
      </div>

      {phase === "found" && items.length === 0 && <div className="card rounded-2xl p-6 max-w-[720px] text-[14.5px] flex items-center gap-2" style={{ color: "#3F7A55" }}><Check size={18} /> All good — no big pictures found. Your site is already light.</div>}

      {phase === "found" && items.length > 0 && (
        <div className="max-w-[720px]">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="card rounded-xl px-5 py-3"><div className="f-code text-[10px]" style={{ color: "#A79B84" }}>BIG PICTURES</div><div className="f-display text-[24px]" style={{ fontWeight: 800 }}>{items.length}</div></div>
            <div className="card rounded-xl px-5 py-3"><div className="f-code text-[10px]" style={{ color: "#A79B84" }}>TOTAL WEIGHT</div><div className="f-display text-[24px]" style={{ fontWeight: 800 }}>{formatBytes(total)}</div></div>
            <button onClick={clean} className="btn-primary rounded-lg px-6 py-2.5 text-[14px] ml-auto">Clean up {items.length === 1 ? "this picture" : "all " + items.length}</button>
          </div>
          <div className="flex flex-col gap-2">{items.map((it, i) => {
            const d = describe(it.source.label, it.path);
            return (
              <div key={i} className="card rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="rounded-lg overflow-hidden shrink-0" style={{ width: 48, height: 48, background: "#F1ECE1" }}><img src={it.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                <div className="min-w-0 flex-1"><div className="text-[14px]" style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{d.title}</div><div className="text-[12px]" style={{ color: "#71675A" }}>{d.part}</div></div>
                <div className="f-display text-[16px] shrink-0" style={{ fontWeight: 800, color: it.bytes > 2000000 ? "#B04A3A" : "var(--accent)" }}>{formatBytes(it.bytes)}</div>
              </div>
            );
          })}</div>
        </div>
      )}

      {phase === "cleaning" && (
        <div className="card rounded-2xl p-6 max-w-[720px]">
          <div className="text-[14.5px] mb-3" style={{ fontWeight: 700 }}>Shrinking pictures… {progress[0]} of {progress[1]}</div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, background: "#EDE6D6" }}><div style={{ width: `${progress[1] ? (progress[0] / progress[1]) * 100 : 0}%`, height: "100%", background: "var(--accent)", transition: "width .3s" }} /></div>
          <div className="text-[12.5px] mt-3" style={{ color: "#A79B84" }}>Please keep this page open until it finishes.</div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="card rounded-2xl p-6 max-w-[720px] mt-5">
          <div className="text-[16px] flex items-center gap-2" style={{ fontWeight: 800, color: "#3F7A55" }}><Check size={18} /> Done</div>
          <div className="text-[14.5px] mt-2" style={{ color: "#4A4338", lineHeight: 1.6 }}>
            {result.cleaned > 0 ? <>Shrunk <strong>{result.cleaned}</strong> {result.cleaned === 1 ? "picture" : "pictures"} and freed up about <strong>{formatBytes(result.savedBytes)}</strong>. </> : "Nothing needed shrinking. "}
            {result.alreadySmall > 0 && <>{result.alreadySmall} {result.alreadySmall === 1 ? "was" : "were"} already as small as they can get. </>}
            {result.failed > 0 && <span style={{ color: "#B04A3A" }}>{result.failed} couldn't be done — press Scan again to retry them.</span>}
          </div>
        </div>
      )}
    </>
  );
}
