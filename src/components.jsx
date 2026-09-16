import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Lock, CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen, Users,
  MessageCircle, ListChecks, Settings, LogOut, Library, ChevronRight,
  ChevronDown, Sparkles, Plus, Check, Send, X, Heart, MessageSquare,
  FileText, Download, GraduationCap, Mail, Phone, Award,
  UserCircle, FolderPlus, Folder, UploadCloud, ClipboardCheck, HelpCircle as HelpIcon,
  Clock, Trash2, Eye, Star, Pencil, PlayCircle, Bell, Megaphone, Layers, AtSign
} from "lucide-react";
import { LOGO_SRC, HERO_SRC, CREATOR_SRC, HOWITWORKS_SRC } from "./assets/brandImages.js";
import { moduleStatus } from "./lib/data.js";
import { changePassword } from "./lib/auth.js";
import { uploadFile } from "./lib/storage.js";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node as TiptapNode } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

// lucide-react dropped trademarked brand marks — small inline stand-ins so the footer keeps working.
export function Instagram({ size = 16, color = "currentColor" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" /></svg>; }
export function Twitter({ size = 16, color = "currentColor" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4.01c-.9.5-1.9.85-2.9 1a4.4 4.4 0 0 0-7.5 4v1A10.66 10.66 0 0 1 3 4.5s-4 9 5 13a11.6 11.6 0 0 1-7 2c9 5 20 0 20-11.5 0-.28 0-.55-.05-.83A7.7 7.7 0 0 0 22 4.01z" /></svg>; }

export function Node({ status, size = 30 }) {
  const base = { width: size, height: size };
  if (status === "complete") return <div className="rounded-full flex items-center justify-center shrink-0" style={{ ...base, background: "var(--accent)" }}><CheckCircle2 size={size * .6} color="#FAF6EC" strokeWidth={2.4} /></div>;
  if (status === "current") return <div className="rounded-full flex items-center justify-center shrink-0 pulse-ring" style={{ ...base, background: "#FAF6EC", border: "2.5px solid var(--accent)" }}><Circle size={size * .32} fill="var(--accent)" color="var(--accent)" /></div>;
  return <div className="rounded-full flex items-center justify-center shrink-0" style={{ ...base, background: "#F0E7D6", border: "1.5px dashed #C9BFAE" }}><Lock size={size * .42} color="#A79B84" /></div>;
}
export function Spine({ course, enrollment, onOpen, compact }) {
  return (
    <div className="relative">
      {course.modules.map((m, i) => {
        const status = onOpen ? moduleStatus(course, enrollment, m.id) : "locked";
        const clickable = onOpen && status !== "locked";
        const Wrap = clickable ? "button" : "div";
        return (
          <div key={m.id} className="flex items-start gap-4 relative" style={{ paddingBottom: i === course.modules.length - 1 ? 0 : compact ? 20 : 30 }}>
            {i !== course.modules.length - 1 && <div className={`absolute rounded-full ${status === "complete" ? "node-line-done grow-line" : "node-line-locked"}`} style={{ left: compact ? 14 : 17, top: compact ? 30 : 34, width: 2.5, height: compact ? 20 : 30 }} />}
            <Node status={status} size={compact ? 30 : 34} />
            <Wrap onClick={clickable ? () => onOpen(m.id) : undefined} className="pt-1 text-left" style={clickable ? { cursor: "pointer" } : {}}>
              <div className="f-code text-[11px] mb-0.5" style={{ color: status === "locked" ? "#A79B84" : "var(--accent)" }}>{m.testType === "milestone" ? "MILESTONE" : "MODULE"} {String(i + 1).padStart(2, "0")}</div>
              <div className={compact ? "text-[14px]" : "text-[17px]"} style={{ color: status === "locked" ? "#A79B84" : "#262019", fontWeight: status === "current" ? 700 : 600, maxWidth: 340 }}>{m.title}</div>
              {status === "current" && !compact && <div className="f-code text-[10px] mt-1.5 flex items-center gap-1" style={{ color: "#B8912E" }}><ArrowRight size={11} /> YOU ARE HERE</div>}
              {clickable && !compact && <div className="text-[12px] mt-1 flex items-center gap-1" style={{ color: "var(--accent)", fontWeight: 600 }}><PlayCircle size={13} /> {status === "complete" ? "Review lesson" : "Open lesson"}</div>}
            </Wrap>
          </div>
        );
      })}
    </div>
  );
}
export function LogoMark({ height = 72 }) { return <img src={LOGO_SRC} alt="FJ Room" style={{ height, width: "auto", display: "block" }} />; }
// Shows the full image, uncropped, with a soft blurred fill behind it so there's no dead space — a nicer, more balanced frame than a tall letterboxed strip.
export function CourseImage({ src, ratio = "16/9", radius = 20, icon: Icon = GraduationCap, iconSize = 34 }) {
  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: ratio, borderRadius: radius, background: src ? "#EDE4CF" : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, white), #F0E7D6)" }}>
      {src ? (
        <>
          <img src={src} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(24px) saturate(1.1) brightness(.85)", transform: "scale(1.2)" }} />
          <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center"><Icon size={iconSize} color="var(--accent)" strokeWidth={1.3} /></div>
      )}
    </div>
  );
}
export function Field({ label, ...props }) { return <label className="block">{label && <div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{label}</div>}<input className="input-field rounded-lg px-3.5 py-2.5" {...props} /></label>; }

// Real WYSIWYG editing for lecture notes/briefs: select text and press the
// toolbar buttons (or the browser's native Ctrl+B / Ctrl+I, which just work
// inside a contentEditable box) and it visibly bolds/italicizes/etc right
// there while typing -- not a markdown shorthand you have to remember and
// only see rendered later. Stores real HTML. Old plain-text notes still
// display fine, since plain text with no tags in it renders identically as
// "HTML" with none of the elements a browser would treat as markup.
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "H1", "H2", "H3", "UL", "OL", "LI", "P", "DIV", "BR", "BLOCKQUOTE", "SPAN", "IMG", "FIGURE", "FIGCAPTION"]);
// The color picker's only output is a single "color: <value>" declaration
// on a <span> -- anything else in a style attribute (including a second
// declaration smuggled in after a semicolon) is rejected outright rather
// than trimmed, so there's no partial-sanitization gap to exploit. Both
// forms are allowed because the browser itself rewrites a hex value like
// "#cc3355" to "rgb(204, 51, 85)" when the attribute is read back, so a
// hex-only pattern silently stripped every real color a user picked.
const SAFE_COLOR_STYLE = /^color:\s*(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/;
function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  (function clean(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      if (!ALLOWED_TAGS.has(child.tagName)) { const text = document.createTextNode(child.textContent); node.replaceChild(text, child); return; }
      if (child.tagName === "IMG") {
        // Only a data: image or an http(s) URL is a real image -- anything
        // else (javascript:, etc.) drops the image entirely rather than
        // risk rendering it.
        const src = child.getAttribute("src") || "";
        const alt = child.getAttribute("alt") || "";
        [...child.attributes].forEach((a) => child.removeAttribute(a.name));
        if (/^(data:image\/|https?:\/\/)/i.test(src)) { child.setAttribute("src", src); if (alt) child.setAttribute("alt", alt); }
        else { child.remove(); return; }
      } else if (child.tagName === "FIGURE") {
        [...child.attributes].forEach((a) => child.removeAttribute(a.name));
        child.setAttribute("class", "rt-figure");
      } else if (child.tagName === "SPAN") {
        const style = (child.getAttribute("style") || "").trim().replace(/;$/, "");
        [...child.attributes].forEach((a) => child.removeAttribute(a.name));
        if (SAFE_COLOR_STYLE.test(style)) child.setAttribute("style", style);
      } else {
        [...child.attributes].forEach((a) => child.removeAttribute(a.name));
      }
      clean(child);
    });
  })(doc.body);
  return doc.body.innerHTML;
}
// A custom atom node (image + optional caption) instead of the plain Tiptap
// Image extension -- the caption needs its own editable field attached to
// the image, which a plain <img> attribute can't provide.
const ImageFigure = TiptapNode.create({
  name: "imageFigure",
  group: "block",
  atom: true,
  // Not selectable: clicking directly on the image (an easy, likely click
  // target once it's the biggest thing in the box) used to create a node
  // selection, and typing right after that -- the ordinary way anyone
  // resumes writing -- silently replaced the whole image with the typed
  // text. Confirmed by testing this exact click-then-type sequence.
  // Unselectable atoms can't be node-selected, so a click near the image
  // resolves to the nearest real text position instead, and the image can
  // only be removed deliberately (backspace/delete from beside it).
  selectable: false,
  addAttributes() {
    return {
      src: { default: null, renderHTML: () => ({}) },
      alt: { default: "", renderHTML: () => ({}) },
      caption: { default: "", renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [{
      tag: "figure.rt-figure",
      getAttrs: (el) => ({
        src: el.querySelector("img")?.getAttribute("src") || null,
        alt: el.querySelector("img")?.getAttribute("alt") || "",
        caption: el.querySelector("figcaption")?.textContent || "",
      }),
    }];
  },
  renderHTML({ node }) {
    const { src, alt, caption } = node.attrs;
    return ["figure", { class: "rt-figure" }, ["img", { src, alt: alt || "" }], ...(caption ? [["figcaption", {}, caption]] : [])];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageFigureView);
  },
});
function ImageFigureView({ node, updateAttributes, selected }) {
  return (
    <NodeViewWrapper className="rt-figure" style={{ margin: "16px 0", outline: selected ? "2px solid var(--accent)" : "none", borderRadius: 10 }}>
      <img src={node.attrs.src} alt={node.attrs.alt || ""} style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 10, display: "block" }} />
      <input
        value={node.attrs.caption || ""}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Add a caption (optional)"
        className="f-code"
        style={{ width: "100%", marginTop: 6, fontSize: 13, color: "#71675A", fontStyle: "italic", border: "none", outline: "none", background: "transparent", padding: 0 }}
      />
    </NodeViewWrapper>
  );
}
// Built on Tiptap/ProseMirror rather than raw contentEditable + execCommand.
// The first version used execCommand directly, which turned out to corrupt
// content whenever two block types were combined in one session (a list
// after a heading, a quote after a list, etc.) -- a known, long-standing
// unreliability of that browser API, confirmed by testing it directly.
// Tiptap edits a real document model with proper transactions instead of
// raw DOM selection hacks, so combining formats behaves predictably.
export function RichTextEditor({ value, onChange, minRows = 8 }) {
  const wrapRef = useRef(null);
  const imageInputRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), TextStyle, Color, ImageFigure],
    content: value || "",
    onUpdate: ({ editor }) => { onChange(sanitizeHtml(editor.getHTML())); checkSlash(editor); },
    onSelectionUpdate: ({ editor }) => checkSlash(editor),
  });
  function insertImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { editor.chain().focus().insertContent({ type: "imageFigure", attrs: { src: reader.result, alt: "", caption: "" } }).run(); };
    reader.readAsDataURL(file);
  }
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) editor.commands.setContent(value || "", false);
  }, [value, editor]);
  useEffect(() => () => editor?.destroy(), [editor]);

  // Notion-style "/" menu: typing "/" right after whitespace or at the
  // start of a block opens a list of block types.
  function checkSlash(ed) {
    const { state } = ed; const { $from } = state.selection;
    const charBefore = $from.nodeBefore?.isText ? $from.nodeBefore.text.slice(-1) : "";
    if (charBefore === "/" && ed.view.hasFocus()) {
      const coords = ed.view.coordsAtPos($from.pos); const wrapRect = wrapRef.current.getBoundingClientRect();
      setSlashMenu({ top: coords.bottom - wrapRect.top + 4, left: coords.left - wrapRect.left });
    } else setSlashMenu(null);
  }
  // Deleting the "/" and applying the format as two separate .run() calls
  // left a stale position behind for the wrap-style commands (blockquote
  // wraps the block rather than just relabeling it, which shifts positions
  // downstream) -- doing both in one continuous chain, one transaction,
  // fixed it, confirmed by testing this exact case directly.
  function applySlash(chainFn) {
    const pos = editor.state.selection.$from.pos;
    chainFn(editor.chain().focus().deleteRange({ from: pos - 1, to: pos })).run();
    setSlashMenu(null);
  }
  // Image needs an actual file picker, not a synchronous editor command --
  // clears the "/" immediately (same as every other option) but the insert
  // itself happens later, once a file's been chosen and read.
  function applySlashImage() {
    const pos = editor.state.selection.$from.pos;
    editor.chain().focus().deleteRange({ from: pos - 1, to: pos }).run();
    setSlashMenu(null);
    imageInputRef.current?.click();
  }
  const slashOptions = [
    { label: "Heading 1", chain: (c) => c.toggleHeading({ level: 1 }) },
    { label: "Heading 2", chain: (c) => c.toggleHeading({ level: 2 }) },
    { label: "Heading 3", chain: (c) => c.toggleHeading({ level: 3 }) },
    { label: "Bullet list", chain: (c) => c.toggleBulletList() },
    { label: "Numbered list", chain: (c) => c.toggleOrderedList() },
    { label: "Quote", chain: (c) => c.toggleBlockquote() },
    { label: "Bold text", chain: (c) => c.toggleBold() },
    { label: "Image", onClick: applySlashImage },
    { label: "Normal text", chain: (c) => c.setParagraph() },
  ];
  if (!editor) return null;
  const btn = "f-code text-[12px] px-2.5 py-1.5 rounded";
  const btnStyle = (active) => ({ background: active ? "var(--accent)" : "#fff", color: active ? "#FAF6EC" : "#262019", border: "1px solid #E7DEC9" });
  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="flex items-center gap-1.5 mb-2 p-1.5 rounded-lg flex-wrap" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn} style={{ ...btnStyle(editor.isActive("bold")), fontWeight: 800 }}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn} style={{ ...btnStyle(editor.isActive("italic")), fontStyle: "italic" }}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn} style={btnStyle(editor.isActive("heading", { level: 1 }))}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn} style={btnStyle(editor.isActive("heading", { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn} style={btnStyle(editor.isActive("heading", { level: 3 }))}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn} style={btnStyle(editor.isActive("bulletList"))}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn} style={btnStyle(editor.isActive("orderedList"))}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn} style={btnStyle(editor.isActive("blockquote"))}>" Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={btn} style={btnStyle(editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList"))}>Normal</button>
        <label className={btn} style={{ ...btnStyle(!!editor.getAttributes("textStyle").color), display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          Color
          <input type="color" value={editor.getAttributes("textStyle").color || "#262019"} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} style={{ width: 16, height: 16, padding: 0, border: "none", background: "none", cursor: "pointer" }} />
        </label>
        {editor.getAttributes("textStyle").color && <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className={btn} style={btnStyle(false)}>Clear color</button>}
        <button type="button" onClick={() => imageInputRef.current?.click()} className={btn} style={btnStyle(false)}>+ Image</button>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { insertImage(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <EditorContent editor={editor} className="input-field rich-content rounded-lg px-3.5 py-2.5" style={{ minHeight: minRows * 22 }} onKeyDown={(e) => { if (e.key === "Escape") setSlashMenu(null); }} />
      {slashMenu && (
        <div style={{ position: "absolute", top: slashMenu.top, left: slashMenu.left, zIndex: 50, background: "#fff", border: "1px solid #E7DEC9", borderRadius: 10, boxShadow: "0 14px 30px -10px rgba(0,0,0,.25)", minWidth: 160, overflow: "hidden" }}>
          {slashOptions.map((opt) => (
            <button key={opt.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => opt.onClick ? opt.onClick() : applySlash(opt.chain)} className="block w-full text-left px-3.5 py-2 text-[13px]" style={{ borderBottom: "1px solid #F0E7D6" }}>{opt.label}</button>
          ))}
        </div>
      )}
      <div className="text-[11px] mt-1.5" style={{ color: "#A79B84" }}>Type / for more formatting options.</div>
    </div>
  );
}
// For short plain-text previews (card summaries, list rows) where rendering
// full rich HTML would look wrong at that size -- strips tags down to the
// plain words, so a rich-text field doesn't leak raw "<div>" markup into a
// caption that was never meant to render HTML.
export function stripHtml(html) {
  if (!html) return "";
  return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
}
// The student-facing display side -- just renders that same sanitized HTML,
// growing with however much content is there instead of a fixed-height box.
export function RichText({ html, className = "", style = {} }) {
  if (!html) return null;
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}

// Shared by both the student and admin profile pages -- same "old password,
// new password" re-verification flow either way.
export function ChangePasswordCard({ email }) {
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit() {
    if (newPw.length < 6) { setError("New password needs at least 6 characters."); return; }
    setSaving(true); setError(""); setDone(false);
    const { error: err } = await changePassword(email, oldPw, newPw);
    setSaving(false);
    if (err) { setError(err === "wrong-password" ? "Your current password doesn't match." : err); return; }
    setOldPw(""); setNewPw(""); setDone(true);
  }
  return (
    <div className="card rounded-2xl p-8 mt-6">
      <div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>CHANGE PASSWORD</div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current password" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
        <Field label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
      </div>
      {error && <div className="text-[13px] mt-3" style={{ color: "#B04A3A" }}>{error}</div>}
      <div className="flex items-center gap-3 mt-4">
        <button disabled={saving || !oldPw || newPw.length < 6} onClick={submit} className="btn-primary rounded-lg px-6 py-2.5 text-[14px]">{saving ? "Updating…" : "Update password"}</button>
        {done && <span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Password updated.</span>}
      </div>
    </div>
  );
}
// Generic file upload (PDF, slides, documents, images) — stored as { name, dataUrl }. In-browser only until Supabase is wired up.
export function FileField({ label, value, onChange, accept }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function pick(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true); setError("");
    try {
      const url = await uploadFile(f);
      onChange({ name: f.name, dataUrl: url });
    } catch (err) {
      console.error("uploadFile failed", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      {label && <div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{label}</div>}
      <div className="flex items-center gap-3 flex-wrap">
        {value && <div className="flex items-center gap-2 text-[13px] rounded-lg px-3 py-2" style={{ background: "#F0E7D6" }}><FileText size={14} color="#71675A" /> {value.name}<button onClick={() => onChange(null)}><X size={13} color="#A79B84" /></button></div>}
        <label className="btn-soft rounded-full px-4 py-2 text-[13px]" style={{ fontWeight: 600, cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.7 : 1 }}>{uploading ? "Uploading…" : value ? "Replace file" : "Upload file"}<input type="file" accept={accept} onChange={pick} style={{ display: "none" }} disabled={uploading} /></label>
      </div>
      {error && <div className="text-[12px] mt-1.5" style={{ color: "#B04A3A" }}>{error}</div>}
    </div>
  );
}
export function TextArea({ label, ...props }) { return <label className="block">{label && <div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{label}</div>}<textarea className="input-field rounded-lg px-3.5 py-2.5 resize-y leading-relaxed" rows={3} {...props} /></label>; }
export function SelectF({ label, options, ...props }) { return <label className="block">{label && <div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{label}</div>}<select className="input-field rounded-lg px-3.5 py-2.5" {...props}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>; }
export function ImgField({ label, value, onChange }) {
  function pick(e) { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => onChange(r.result); r.readAsDataURL(f); } }
  return <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{label}</div><div className="flex items-center gap-3"><div className="rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ width: 68, height: 68, background: "#F0E7D6" }}>{value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FolderPlus size={20} color="#A79B84" />}</div><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>Upload image<input type="file" accept="image/*" onChange={pick} style={{ display: "none" }} /></label></div></div>;
}
export function SectionHeader({ eyebrow, title, action }) { return <div className="flex items-center justify-between mb-8 flex-wrap gap-4"><div><div className="f-label text-[13px] mb-2 accent-text">{eyebrow}</div><h1 className="f-display text-[32px]" style={{ fontWeight: 800 }}>{title}</h1></div>{action}</div>; }
export function SidebarLink({ icon: Icon, label, active, onClick }) { return <button onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] w-full text-left transition-colors ${active ? "side-active" : ""}`} style={{ color: active ? undefined : "#4A4237", fontWeight: active ? 700 : 500 }}><Icon size={18} strokeWidth={1.8} /> {label}</button>; }
export function ProgressBar({ pct }) { return <div className="progress-track" style={{ height: 8, width: "100%" }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>; }

// ---------------- Notification bell (shared shape) ----------------
export function NotifBell({ items, seen, onMarkSeen }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const unseen = items.filter((n) => !seen.includes(n.id));
  const PANEL_WIDTH = 300;

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: Math.max(12, Math.min(r.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 12)) });
    }
    setOpen((o) => !o);
    if (!open && unseen.length) onMarkSeen(items.map((n) => n.id));
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggle} className="rounded-full flex items-center justify-center relative" style={{ width: 42, height: 42, background: "#F0E7D6" }}>
        <Bell size={18} color="#4A4237" className={unseen.length ? "bell-ring" : ""} />
        {unseen.length > 0 && <span className="f-code rounded-full absolute flex items-center justify-center" style={{ width: 17, height: 17, background: "#B04A3A", color: "#fff", fontSize: 9, top: 3, right: 3 }}>{unseen.length}</span>}
      </button>
      {open && createPortal(
        <div className="card modal-in rounded-xl p-4 fixed z-[999]" style={{ width: PANEL_WIDTH, top: pos.top, left: pos.left, maxHeight: "70vh", overflowY: "auto" }}>
          <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>NOTIFICATIONS</div>
          {items.length === 0 ? <div className="text-[13px]" style={{ color: "#A79B84" }}>Nothing new.</div> : items.slice().reverse().map((n, i) => <div key={n.id} className="text-[13px] py-2.5" style={{ borderTop: i > 0 ? "1px solid #F0E7D6" : "none" }}>{n.t}</div>)}
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------------- Guide button ----------------
export function GuideButton({ onViewCourses, onSignUp, onViewResources, brand }) {
  const [open, setOpen] = useState(false);
  const links = [
    { t: "Want to apply to a course?", d: "Jump straight to the application.", action: () => { onSignUp(); setOpen(false); } },
    { t: "Want to see what's on offer?", d: "Browse every course in the Room.", action: () => { onViewCourses(); setOpen(false); } },
    { t: "Just want free resources?", d: "No account needed for these.", action: () => { onViewResources(); setOpen(false); } },
  ];
  return (
    <div style={{ position: "fixed", bottom: 26, right: 26, zIndex: 50 }}>
      {open && <div className="card modal-in rounded-2xl p-5 mb-4" style={{ width: 300, boxShadow: "0 24px 50px -20px rgba(38,32,25,.3)" }}><div className="f-display text-[18px] mb-1" style={{ fontWeight: 700 }}>Where do you want to go?</div><div className="text-[13px] mb-4" style={{ color: "#71675A" }}>A quick guide to the Room.</div><div className="flex flex-col gap-2 mb-4">{links.map((l, i) => <button key={i} onClick={l.action} className="text-left rounded-xl p-3.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div className="text-[14px]" style={{ fontWeight: 700 }}>{l.t}</div><div className="text-[12px] mt-0.5" style={{ color: "#71675A" }}>{l.d}</div></button>)}</div><div className="pt-4" style={{ borderTop: "1px solid #E7DEC9" }}><div className="text-[12px] mb-2" style={{ color: "#71675A" }}>Still stuck? Reach us directly.</div><div className="flex gap-2"><a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noreferrer" className="btn-primary rounded-lg py-2 flex-1 text-[12px] text-center flex items-center justify-center gap-1.5"><Phone size={12} /> WhatsApp</a><a href={`mailto:${brand.email}`} className="btn-soft rounded-lg py-2 flex-1 text-[12px] text-center flex items-center justify-center gap-1.5"><Mail size={12} /> Email</a></div></div></div>}
      <button onClick={() => setOpen((o) => !o)} className="btn-primary help-pulse rounded-full flex items-center justify-center" style={{ width: 60, height: 60, marginLeft: "auto" }}>{open ? <X size={22} /> : <Layers size={26} />}</button>
    </div>
  );
}

// =========================================================
// LANDING
// =========================================================
export function Landing({ courses, resources, testimonials, faqs, brand, onSignIn, onSignUp, onViewCourses, onViewResources, onViewCourseDetail }) {
  const publicResources = resources.filter((r) => r.isPublic);
  const liveCourses = courses.filter((c) => c.status === "live").slice(0, 2);
  const [faqOpen, setFaqOpen] = useState(null);
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="relative" style={{ minHeight: "92vh" }}>
        <img src={HERO_SRC} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(30,42,56,.82) 0%, rgba(30,42,56,.58) 42%, rgba(30,42,56,.16) 70%, rgba(30,42,56,0) 100%)" }} />
        <nav className="relative flex items-center justify-between px-8 md:px-16 py-6 max-w-[1500px] mx-auto">
          <LogoMark height={84} />
          <div className="hidden md:flex items-center gap-8 text-[14px]" style={{ color: "#F3EEE1", fontWeight: 700 }}><button onClick={onViewCourses} style={{ color: "#F3EEE1" }}>Courses</button><a href="#how" style={{ color: "#F3EEE1" }}>How It Works</a><a href="#about" style={{ color: "#F3EEE1" }}>About</a><button onClick={onViewResources} style={{ color: "#F3EEE1" }}>Resources</button><a href="#faq" style={{ color: "#F3EEE1" }}>FAQ</a></div>
          <div className="flex items-center gap-3"><button onClick={onSignIn} className="text-[14px] px-3 py-2" style={{ color: "#F3EEE1", fontWeight: 700 }}>Sign In</button><button onClick={() => onSignUp()} className="btn-primary px-6 py-3 rounded-full text-[15px]" style={{ fontWeight: 700 }}>Join the Room</button></div>
        </nav>
        <div className="relative px-8 md:px-16 pt-14 md:pt-20 pb-28 max-w-[700px]">
          <div className="reveal in f-label text-[13px] mb-6" style={{ color: "#CDE8F5" }}>WELCOME TO FJ ROOM</div>
          <h1 className="reveal in f-display text-[58px] md:text-[88px] leading-[1.0] mb-8" style={{ fontWeight: 800, color: "#FAF6EC", animationDelay: "100ms" }}>Learn with<br /><span style={{ fontStyle: "italic" }}>purpose.</span></h1>
          <p className="reveal in text-[19px] md:text-[21px] leading-relaxed mb-10" style={{ color: "#EDF1F3", animationDelay: "200ms", maxWidth: 520 }}>A space to learn practical skills, build confidence, and turn what you learn into something you can actually use.</p>
          <div className="reveal in flex items-center gap-4 flex-wrap" style={{ animationDelay: "300ms" }}><button onClick={onViewCourses} className="btn-primary px-8 py-4 rounded-full text-[16px] flex items-center gap-2" style={{ fontWeight: 700 }}>Explore Courses <ArrowRight size={18} /></button><a href="#how" className="px-8 py-4 rounded-full text-[16px]" style={{ fontWeight: 700, border: "1.5px solid rgba(250,246,236,.65)", color: "#FAF6EC" }}>How It Works</a></div>
        </div>
      </header>

      <section className="max-w-[1500px] mx-auto px-8 md:px-16 pt-24 pb-20">
        <Reveal><div className="flex items-end justify-between mb-12 flex-wrap gap-4"><div><div className="f-label text-[13px] mb-4 accent-text">EXPLORE</div><h2 className="f-display text-[42px]" style={{ fontWeight: 800 }}>Our Courses</h2></div><button onClick={onViewCourses} className="text-[14px] accent-text shrink-0" style={{ fontWeight: 700 }}>View All Courses →</button></div></Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          {liveCourses.map((c, i) => (
            <Reveal key={c.id} delay={i * 90}>
              <button onClick={() => onViewCourseDetail(c.id)} className="card card-pop rounded-2xl overflow-hidden flex flex-col h-full w-full text-left">
                <CourseImage src={c.image} radius={0} />
                <div className="p-6 flex flex-col flex-1"><div className="f-display text-[20px] mb-2" style={{ fontWeight: 700 }}>{c.title}</div><div className="text-[14px] mb-4 flex-1" style={{ color: "#71675A" }}>{c.tagline}</div><span className="btn-soft rounded-full px-4 py-2 text-[12px] self-start" style={{ fontWeight: 700 }}>Apply →</span></div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="px-8 md:px-16 py-28" style={{ background: "#F0E7D6" }}>
        <div className="max-w-[1500px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="f-label text-[13px] mb-4 accent-text">GET STARTED</div><h2 className="f-display text-[44px] mb-12" style={{ fontWeight: 800 }}>How you actually get into the Room.</h2>
            <div className="grid grid-cols-1 gap-8">{[{ n: "01", t: "Create Account", d: "Sign up with your basic information." }, { n: "02", t: "Choose Your Course", d: "Pick a course and answer its application questions." }, { n: "03", t: "Application Review", d: "Reviewed by the Room. Status shows Pending Review." }, { n: "04", t: "Receive Your Code", d: "Once approved, keep an eye on your email for your code — check spam too, just in case." }, { n: "05", t: "Enter Code & Join", d: "Verify your code and step straight into your dashboard." }].map((s, i) => <Reveal key={i} delay={i * 80}><div className="flex items-start gap-4"><div className="f-code text-[15px] shrink-0" style={{ color: "#B8912E", fontWeight: 600 }}>{s.n}</div><div><div className="f-display text-[19px] mb-1" style={{ fontWeight: 700 }}>{s.t}</div><div className="text-[14px]" style={{ color: "#71675A" }}>{s.d}</div></div></div></Reveal>)}</div>
          </Reveal>
          <Reveal delay={120}><img src={HOWITWORKS_SRC} alt="" style={{ width: "100%", maxWidth: 460, margin: "0 auto", display: "block", filter: "drop-shadow(0 30px 40px rgba(38,32,25,.18))" }} /></Reveal>
        </div>
      </section>

      <section className="max-w-[1500px] mx-auto px-8 md:px-16 py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
          <Reveal><div className="f-label text-[13px] mb-4 accent-text">OUR WHY</div><h2 className="f-display text-[38px] mb-6" style={{ fontWeight: 800 }}>Why our courses are created.</h2><p className="text-[16px] leading-relaxed mb-5" style={{ color: "#4A4237" }}>You shouldn't have to spend time learning a skill only to finish the course and wonder what to do next. FJ Room exists to help people learn skills they can apply, practise, and build real opportunities with.</p><p className="f-display text-[22px]" style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 700 }}>Learn it. Practise it. Use it. Grow with it.</p></Reveal>
          <Reveal delay={100}><div className="rounded-2xl p-10 flex items-center justify-center" style={{ background: "linear-gradient(155deg, color-mix(in srgb, var(--accent) 16%, white), #F0E7D6)", minHeight: 260 }}><div className="f-display text-center text-[26px] leading-snug" style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 700 }}>"You don't just take courses here. You grow."</div></div></Reveal>
        </div>
        <Reveal><div className="rounded-2xl p-10 grid md:grid-cols-2 gap-10" style={{ background: "var(--accent)" }}><div><div className="f-label text-[13px] mb-3" style={{ color: "#CDE8F5" }}>OUR MISSION</div><p className="text-[17px] leading-relaxed" style={{ color: "#FAF6EC" }}>To help people build practical digital skills through intentional learning, real world practice, and meaningful support.</p></div><div><div className="f-label text-[13px] mb-3" style={{ color: "#CDE8F5" }}>OUR VISION</div><p className="text-[17px] leading-relaxed" style={{ color: "#FAF6EC" }}>A world where learning is practical, accessible, and personal.</p></div></div></Reveal>
      </section>

      <section id="about" className="max-w-[1500px] mx-auto px-8 md:px-16 py-28 grid md:grid-cols-5 gap-16 items-center">
        <Reveal className="md:col-span-2 flex justify-center"><div className="rounded-3xl overflow-hidden" style={{ width: 280, height: 280 }}><img src={CREATOR_SRC} alt="Fidelia Joseph" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div></Reveal>
        <Reveal delay={100} className="md:col-span-3">
          <div className="f-label text-[13px] mb-4 accent-text">MEET THE CREATOR</div><h2 className="f-display text-[40px] mb-6" style={{ fontWeight: 800 }}>Fidelia Joseph.</h2>
          <p className="f-display text-[20px] leading-relaxed mb-5" style={{ fontStyle: "italic", color: "#4A4237" }}>"You're not in this room by mistake. You're here to learn. I've been coaching for over two years now, and I kept seeing the same thing: people finishing a course and still not knowing what to actually do with it. So I asked myself: what if it wasn't just an LMS. What if it was a room. Somewhere that feels cozy, somewhere homely, where you can learn freely, ask your questions, and get all the clarity and guidance you need, to stay positioned, and to actually make the money you set out to make."</p>
          <div className="text-[14px]" style={{ color: "#71675A", fontWeight: 600 }}>— The Creator</div>
        </Reveal>
      </section>

      <section className="max-w-[1500px] mx-auto px-8 md:px-16 pb-28">
        <Reveal><div className="flex items-end justify-between mb-10 flex-wrap gap-4"><div><div className="f-label text-[13px] mb-4 accent-text">FREE RESOURCES</div><h2 className="f-display text-[34px]" style={{ fontWeight: 800 }}>Templates, guides & checklists.</h2></div><button onClick={onViewResources} className="btn-ghost rounded-full px-5 py-2.5 text-[13px]" style={{ fontWeight: 700 }}>Browse Resources</button></div></Reveal>
        <div className="grid md:grid-cols-4 gap-5">{publicResources.slice(0, 4).map((r, i) => <Reveal key={r.id} delay={i * 80}><div className="card card-pop rounded-xl p-5"><FileText size={22} color="var(--accent)" className="mb-3" /><div className="text-[15px] mb-1" style={{ fontWeight: 700 }}>{r.title}</div><div className="text-[13px] mb-3" style={{ color: "#71675A" }}>{r.description}</div><div className="flex items-center gap-1.5 text-[12px] accent-text" style={{ fontWeight: 700 }}><Download size={13} /> FREE {r.kind === "file" ? "DOWNLOAD" : "RESOURCE"}</div></div></Reveal>)}</div>
      </section>

      <section className="px-8 md:px-16 py-28" style={{ background: "var(--accent)" }}>
        <div className="max-w-[1500px] mx-auto"><Reveal><div className="f-label text-[13px] mb-4" style={{ color: "#CDE8F5" }}>FROM THE ROOM</div><h2 className="f-display text-[36px] mb-16 max-w-[640px]" style={{ fontWeight: 800, color: "#FAF6EC" }}>Real words from real students.</h2></Reveal><div className="grid md:grid-cols-3 gap-6">{testimonials.map((t, i) => <Reveal key={t.id} delay={i * 90}><div className="rounded-2xl p-8 h-full" style={{ background: "rgba(250,246,236,.09)", border: "1px solid rgba(250,246,236,.2)" }}><div className="flex gap-1 mb-4">{[...Array(5)].map((_, si) => <Star key={si} size={13} fill="#B8912E" color="#B8912E" />)}</div><div className="text-[17px] leading-relaxed mb-6" style={{ color: "#FAF6EC", fontStyle: "italic" }}>"{t.quote}"</div><div className="text-[14px]" style={{ color: "#CDE8F5", fontWeight: 700 }}>{t.name}</div></div></Reveal>)}</div></div>
      </section>

      <section id="faq" className="max-w-[1000px] mx-auto px-8 md:px-16 py-28">
        <Reveal><div className="f-label text-[13px] mb-4 accent-text">FAQ</div><h2 className="f-display text-[38px] mb-12" style={{ fontWeight: 800 }}>Frequently asked questions.</h2></Reveal>
        <div className="flex flex-col gap-3 mb-10">{faqs.map((f, i) => <Reveal key={f.id} delay={i * 50}><div className="card rounded-xl overflow-hidden"><button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left"><span className="text-[16px]" style={{ fontWeight: 700 }}>{f.q}</span><ChevronDown size={18} color="#A79B84" style={{ transform: faqOpen === i ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} /></button>{faqOpen === i && <div className="px-6 pb-5 text-[14px]" style={{ color: "#71675A" }}>{f.a}</div>}</div></Reveal>)}</div>
        <Reveal><div className="rounded-2xl p-10 text-center" style={{ background: "color-mix(in srgb, var(--accent) 10%, white)" }}><div className="f-display text-[22px] mb-2" style={{ fontWeight: 800 }}>Still have questions?</div><a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noreferrer" className="btn-primary rounded-full px-7 py-3.5 text-[15px] inline-block mt-4" style={{ fontWeight: 700 }}>Message us on WhatsApp</a></div></Reveal>
      </section>

      <footer className="px-8 md:px-16 py-16" style={{ background: "#262019" }}>
        <div className="max-w-[1500px] mx-auto">
          <div className="f-display text-[28px] mb-1" style={{ color: "#FAF6EC", fontStyle: "italic", fontWeight: 700 }}>This is more than learning.</div>
          <div className="f-display text-[28px] mb-12" style={{ color: "#FAF6EC", fontStyle: "italic", fontWeight: 700 }}>This is your growth room.</div>
          <div className="grid md:grid-cols-3 gap-10 pt-10" style={{ borderTop: "1px solid rgba(250,246,236,.14)" }}>
            <LogoMark height={50} />
            <div className="flex flex-col gap-3 text-[15px]" style={{ color: "#F3EEE1", fontWeight: 700 }}><button onClick={onViewCourses} style={{ color: "#F3EEE1", textAlign: "left" }}>Courses</button><a href="#how" style={{ color: "#F3EEE1" }}>How It Works</a><a href="#about" style={{ color: "#F3EEE1" }}>About</a><button onClick={onViewResources} style={{ color: "#F3EEE1", textAlign: "left" }}>Resources</button><a href="#faq" style={{ color: "#F3EEE1" }}>FAQ</a></div>
            <div className="flex flex-col gap-3"><a href={`mailto:${brand.email}`} className="flex items-center gap-3 text-[15px]" style={{ color: "#F3EEE1" }}><span className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: "rgba(250,246,236,.1)" }}><Mail size={16} /></span> {brand.email}</a><a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[15px]" style={{ color: "#F3EEE1" }}><span className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: "rgba(250,246,236,.1)" }}><Phone size={16} /></span> WhatsApp us</a><div className="flex items-center gap-3 mt-1"><a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: "rgba(250,246,236,.1)", color: "#F3EEE1" }}><Instagram size={16} /></a><a href={`https://twitter.com/${brand.twitter}`} target="_blank" rel="noreferrer" className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: "rgba(250,246,236,.1)", color: "#F3EEE1" }}><Twitter size={16} /></a></div></div>
          </div>
          <div className="f-code text-[11px] mt-12" style={{ color: "#615748" }}>© 2026 FJ ROOM. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
      <GuideButton onViewCourses={onViewCourses} onSignUp={onSignUp} onViewResources={onViewResources} brand={brand} />
    </div>
  );
}
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null); const [visible, setVisible] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }); }, { threshold: 0.15 }); obs.observe(el); return () => obs.disconnect(); }, []);
  return <div ref={ref} className={`reveal ${visible ? "in" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

// =========================================================
// COURSES INDEX / DETAIL / RESOURCES
// =========================================================
export function BackBar({ onBack }) { return <nav className="flex items-center justify-between px-8 md:px-16 py-6 max-w-[1500px] mx-auto"><button onClick={onBack} className="flex items-center gap-3 text-[14px]" style={{ color: "#4A4237", fontWeight: 700 }}><ArrowLeft size={17} /> Back to FJ Room</button><LogoMark height={56} /></nav>; }
export function CoursesIndex({ courses, onBack, onOpen }) {
  const [levelFilter, setLevelFilter] = useState("all");
  const liveCourses = courses.filter((c) => c.status === "live" && (levelFilter === "all" || c.level === levelFilter));
  return (
    <div className="min-h-screen">
      <BackBar onBack={onBack} />
      <header className="max-w-[900px] mx-auto px-8 text-center pt-8 pb-14"><div className="f-label text-[13px] mb-4 accent-text">ALL COURSES</div><h1 className="f-display text-[46px] mb-4" style={{ fontWeight: 800 }}>Find your course.</h1><p className="text-[16px]" style={{ color: "#71675A" }}>Every course in FJ Room is built to help you gain real skills, solve real problems, and stand out in the real world.</p></header>
      <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-2 mb-10 flex-wrap">{["all", "Beginner", "Intermediate", "Advanced"].map((l) => <button key={l} onClick={() => setLevelFilter(l)} className="rounded-full px-4 py-2 text-[13px]" style={{ background: levelFilter === l ? "var(--accent)" : "#F0E7D6", color: levelFilter === l ? "#FAF6EC" : "#71675A", fontWeight: 700 }}>{l === "all" ? "All levels" : l}</button>)}</div>
      <div className="max-w-[1200px] mx-auto px-8 pb-14 grid md:grid-cols-3 gap-6">{liveCourses.map((c, i) => <Reveal key={c.id} delay={i * 90}><button onClick={() => onOpen(c.id)} className="card card-pop rounded-2xl overflow-hidden w-full text-left flex flex-col h-full"><CourseImage src={c.image} radius={0} /><div className="p-6"><div className="f-display text-[20px] mb-2" style={{ fontWeight: 700 }}>{c.title}</div><div className="text-[14px]" style={{ color: "#71675A" }}>{c.tagline}</div></div></button></Reveal>)}</div>
      <div className="max-w-[1200px] mx-auto px-8 pb-28 text-center text-[13px]" style={{ color: "#A79B84" }}>More courses are on the way.</div>
    </div>
  );
}
export function CourseDetail({ course, testimonials, onBack, onApply }) {
  const related = testimonials.filter((t) => course.testimonialIds?.includes(t.id));
  return (
    <div className="min-h-screen">
      <BackBar onBack={onBack} />
      <div className="max-w-[1000px] mx-auto px-8 pb-28">
        <Reveal><div className="mb-10"><CourseImage src={course.image} ratio="21/9" iconSize={60} /></div></Reveal>
        <Reveal delay={80}><div className="f-code text-[13px] mb-3 accent-text">{course.level?.toUpperCase()} · {course.durationWeeks} WEEKS · {course.modules.length} MODULES</div><h1 className="f-display text-[42px] mb-3" style={{ fontWeight: 800 }}>{course.title}</h1><p className="f-display text-[20px] mb-6" style={{ fontStyle: "italic", color: "var(--accent)" }}>{course.tagline}</p><p className="text-[16px] leading-relaxed mb-10 whitespace-pre-wrap" style={{ color: "#4A4237", maxWidth: 640 }}>{course.description}</p></Reveal>
        {course.outcomes?.length > 0 && <Reveal delay={140}><div className="card rounded-2xl p-8 mb-8"><div className="f-display text-[20px] mb-5" style={{ fontWeight: 700 }}>What you'll learn</div><div className="grid md:grid-cols-2 gap-3">{course.outcomes.map((o, i) => <div key={i} className="flex items-start gap-2.5 text-[15px]" style={{ color: "#4A4237" }}><CheckCircle2 size={16} color="var(--accent)" className="mt-0.5 shrink-0" /> {o}</div>)}</div></div></Reveal>}
        {related.length > 0 && <Reveal delay={180}><div className="mb-10"><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>WHAT STUDENTS SAY</div><div className="grid md:grid-cols-2 gap-4">{related.map((t) => <div key={t.id} className="card rounded-xl p-5"><div className="text-[14px] mb-2" style={{ fontStyle: "italic", color: "#4A4237" }}>"{t.quote}"</div><div className="text-[13px] accent-text" style={{ fontWeight: 700 }}>{t.name}</div></div>)}</div></div></Reveal>}
        <Reveal delay={220}><button onClick={() => onApply(course.id)} className="btn-primary rounded-full px-8 py-4 text-[16px]" style={{ fontWeight: 700 }}>Apply for Course</button></Reveal>
      </div>
    </div>
  );
}
// Shown when a student clicks "View" on a resource — full details before deciding to download.
export function ResourceDetail({ resource, onClose, onBrowseMore }) {
  const [copied, setCopied] = useState(false);
  function copyLink() {
    const link = `${window.location.origin}/?r=${resource.id}`;
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: "rgba(38,32,25,.5)", zIndex: 999 }} onClick={onClose}>
      <div className="card modal-in rounded-2xl p-8 max-w-[520px] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><div className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: "color-mix(in srgb, var(--accent) 14%, white)" }}><FileText size={20} color="var(--accent)" /></div><button onClick={onClose}><X size={18} color="#A79B84" /></button></div>
        <div className="f-display text-[22px] mb-2" style={{ fontWeight: 800 }}>{resource.title}</div>
        <div className="f-label text-[11px] mb-5" style={{ color: "#A79B84" }}>{(resource.type || "RESOURCE").toUpperCase()} · {resource.folder}</div>
        <p className="text-[14px] leading-relaxed mb-7 whitespace-pre-wrap" style={{ color: "#4A4237" }}>{resource.description}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {resource.kind === "file" && resource.file ? (
            <a href={resource.file.dataUrl} download={resource.file.name} className="btn-primary rounded-full px-6 py-3 text-[14px] inline-flex items-center gap-2"><Download size={15} /> Download {resource.file.name}</a>
          ) : (
            <a href={resource.url} target="_blank" rel="noreferrer" className="btn-primary rounded-full px-6 py-3 text-[14px] inline-flex items-center gap-2"><Download size={15} /> Go to link</a>
          )}
          {resource.isPublic && <button onClick={copyLink} className="btn-soft rounded-full px-5 py-3 text-[14px] inline-flex items-center gap-2" style={{ fontWeight: 700 }}>{copied ? "Link copied!" : "Copy shareable link"}</button>}
        </div>
        {onBrowseMore && <button onClick={onBrowseMore} className="text-[13px] mt-6 flex items-center gap-1.5 accent-text" style={{ fontWeight: 700 }}>Check our other free resources <ArrowRight size={13} /></button>}
      </div>
    </div>
  );
}
export function ResourcesPage({ resources, onBack }) {
  const [viewing, setViewing] = useState(null);
  const publicResources = resources.filter((r) => r.isPublic);
  const categories = [...new Set(publicResources.map((r) => r.folder))];
  const viewingResource = viewing ? resources.find((r) => r.id === viewing) : null;
  return (
    <div className="min-h-screen">
      <BackBar onBack={onBack} />
      <header className="max-w-[800px] mx-auto px-8 text-center pt-8 pb-16"><div className="f-label text-[13px] mb-4 accent-text">HELPFUL RESOURCES</div><h1 className="f-display text-[42px] mb-4" style={{ fontWeight: 800 }}>Free tools & templates.</h1></header>
      <div className="max-w-[1200px] mx-auto px-8 pb-28">{categories.map((cat) => <div key={cat} className="mb-14"><div className="f-label text-[13px] mb-5 accent-text">{cat.toUpperCase()}</div><div className="grid md:grid-cols-4 gap-5">{publicResources.filter((r) => r.folder === cat).map((r, i) => (
        <Reveal key={r.id} delay={i * 60}>
          <div className="card card-pop rounded-xl p-5 flex flex-col h-full">
            <FileText size={20} color="var(--accent)" className="mb-3" />
            <div className="text-[15px] mb-1.5" style={{ fontWeight: 700 }}>{r.title}</div>
            <div className="text-[13px] mb-4 flex-1" style={{ color: "#71675A" }}>{r.description.slice(0, 70)}{r.description.length > 70 ? "…" : ""}</div>
            <button onClick={() => setViewing(r.id)} className="btn-soft rounded-full px-3 py-2 text-[11px] flex items-center gap-1 self-start" style={{ fontWeight: 700 }}><Eye size={12} /> View details</button>
          </div>
        </Reveal>
      ))}</div></div>)}</div>
      {viewingResource && <ResourceDetail resource={viewingResource} onClose={() => setViewing(null)} />}
    </div>
  );
}

// =========================================================
// APPLICATION FORM
// =========================================================
export function ApplicationForm({ courses, cohorts, presetCourseId, existingUser, onSubmit, onCancel }) {
  const [step, setStep] = useState(existingUser ? 1 : 0);
  const [name, setName] = useState(existingUser?.name || ""); const [email, setEmail] = useState(existingUser?.email || ""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false); const [submitError, setSubmitError] = useState("");
  const [courseId, setCourseId] = useState(presetCourseId || courses.find((c) => c.status === "live")?.id);
  const course = courses.find((c) => c.id === courseId);
  const questions = course?.applicationQuestions || [];
  const [answers, setAnswers] = useState(questions.map(() => ""));
  useEffect(() => { setAnswers(questions.map(() => "")); }, [courseId]);
  const userCohort = existingUser ? cohorts.find((co) => co.id === existingUser.cohortId) : null;
  const liveCourses = courses.filter((c) => c.status === "live" && !(existingUser?.enrollments || []).some((e) => e.courseId === c.id) && (!userCohort || userCohort.courseIds.includes(c.id)));
  const steps = existingUser ? ["Choose a course", "A few questions", "Review"] : ["Your details", "Choose a course", "A few questions", "Review"];
  const stepOffset = existingUser ? 1 : 0;
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="reveal in w-full max-w-[560px]">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back</button>
        <div className="flex items-center gap-2 mb-8">{steps.map((s, i) => <div key={i} className="flex-1"><div className="h-1 rounded-full mb-2" style={{ background: (i + stepOffset) <= step ? "var(--accent)" : "#E7DEC9" }} /><div className="f-label text-[10px]" style={{ color: (i + stepOffset) <= step ? "var(--accent)" : "#A79B84" }}>{s.toUpperCase()}</div></div>)}</div>
        <div className="card rounded-2xl p-8" style={{ boxShadow: "0 20px 50px -24px rgba(38,32,25,0.16)" }}>
          {step === 0 && <div className="flex flex-col gap-4"><h2 className="f-display text-[26px] mb-1" style={{ fontWeight: 800 }}>Let's start with you.</h2><Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} /><Field label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /><Field label="Phone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} /><div><Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />{password.length > 0 && password.length < 6 && <div className="text-[12px] mt-1.5" style={{ color: "#B04A3A" }}>Needs at least 6 characters ({password.length}/6 so far).</div>}</div><button disabled={!name || !email || password.length < 6} onClick={() => setStep(1)} className="btn-primary rounded-lg py-3 text-[15px] mt-2">Continue</button></div>}
          {step === 1 && <div className="flex flex-col gap-4"><h2 className="f-display text-[26px] mb-1" style={{ fontWeight: 800 }}>Which course?</h2><div className="flex flex-col gap-3">{liveCourses.map((c) => <button key={c.id} onClick={() => setCourseId(c.id)} className="text-left rounded-xl p-4" style={{ border: courseId === c.id ? "2px solid var(--accent)" : "1px solid #E7DEC9", background: courseId === c.id ? "color-mix(in srgb, var(--accent) 10%, white)" : "#fff" }}><div className="text-[16px]" style={{ fontWeight: 700 }}>{c.title}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{c.tagline}</div></button>)}{liveCourses.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>You're already enrolled in everything available right now.</div>}</div><div className="flex gap-3 mt-2">{!existingUser && <button onClick={() => setStep(0)} className="text-[13px]" style={{ color: "#A79B84" }}>Back</button>}<button disabled={!courseId || liveCourses.length === 0} onClick={() => setStep(2)} className="btn-primary rounded-lg py-3 text-[15px] flex-1">Continue</button></div></div>}
          {step === 2 && <div className="flex flex-col gap-4"><h2 className="f-display text-[26px] mb-1" style={{ fontWeight: 800 }}>A few questions.</h2>{questions.map((q, i) => <TextArea key={i} label={q} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((x, idx) => idx === i ? e.target.value : x))} />)}<div className="flex gap-3 mt-1"><button onClick={() => setStep(1)} className="text-[13px]" style={{ color: "#A79B84" }}>Back</button><button onClick={() => setStep(3)} className="btn-primary rounded-lg py-3 text-[15px] flex-1">Review application</button></div></div>}
          {step === 3 && <div className="flex flex-col gap-4"><h2 className="f-display text-[26px] mb-1" style={{ fontWeight: 800 }}>Ready to submit?</h2><div className="rounded-xl p-4 text-[13px] flex flex-col gap-1.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div><strong>{name}</strong> · {email}</div><div style={{ color: "#71675A" }}>Applying to: {course?.title}</div></div><div className="text-[13px]" style={{ color: "#71675A" }}>Your application is reviewed by the Room. Keep an eye on your email for your code — including your spam/junk folder, just in case.</div>{submitError && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{submitError}</div>}<div className="flex gap-3 mt-1"><button onClick={() => setStep(2)} className="text-[13px]" style={{ color: "#A79B84" }}>Back</button><button disabled={submitting} onClick={async () => { setSubmitting(true); setSubmitError(""); const err = await onSubmit({ name, email, phone, courseId, answers, password }); setSubmitting(false); if (err) setSubmitError(err); }} className="btn-primary rounded-lg py-3 text-[15px] flex-1">{submitting ? "Submitting…" : "Submit application"}</button></div></div>}
        </div>
      </div>
    </div>
  );
}

export function SignInScreen({ students, applicants, onBack, onEnterStudent, onEnterApplicant, onEnterAdmin, onSignIn, onForgotPassword }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  async function submit() {
    if (!email.trim() || !pw) return;
    setSubmitting(true); setError("");
    const result = await onSignIn(email.trim(), pw);
    setSubmitting(false);
    if (result === "not-found") setError("We don't recognize that email or Student ID.");
    else if (result === "wrong-password") setError("That password doesn't match.");
    else if (result === "network") setError("Couldn't reach the server — check your connection and try again.");
    else if (result) setError(`Something went wrong: ${result}`);
  }
  async function forgotPassword() {
    if (!email.trim() || !email.includes("@")) { setError("Enter your email above first, then tap \"Forgot password?\" again."); return; }
    setError(""); setForgotSent(false);
    const err = await onForgotPassword(email.trim());
    if (err) setError("Couldn't send the reset email — please try again.");
    else setForgotSent(true);
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="reveal in w-full max-w-[420px]">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-8" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back</button>
        <div className="flex flex-col items-center text-center mb-8"><LogoMark height={80} /><div className="f-label text-[13px] mt-5 mb-1 accent-text">WELCOME BACK</div><h2 className="f-display text-[26px]" style={{ fontWeight: 800 }}>Sign in</h2></div>
        <div className="card rounded-2xl p-7 flex flex-col gap-4" style={{ boxShadow: "0 20px 50px -24px rgba(38,32,25,0.16)" }}>
          <Field label="Email address or Student ID" value={email} onChange={(e) => setEmail(e.target.value)} /><Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {error && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{error}</div>}
          {forgotSent && <div className="text-[13px] accent-text">Check your email for a reset link.</div>}
          <button disabled={submitting} onClick={submit} className="btn-primary rounded-lg py-3 text-[15px] mt-1">{submitting ? "Signing in…" : "Sign in"}</button>
          <button onClick={forgotPassword} className="text-[12px] mx-auto" style={{ color: "#A79B84" }}>Forgot password?</button>
          {import.meta.env.DEV && (
            <>
              <div className="f-label text-[11px] mt-2" style={{ color: "#A79B84" }}>QUICK DEMO ACCESS (dev only)</div>
              <div className="flex flex-col gap-2">
                <button onClick={onEnterAdmin} className="text-left rounded-lg px-4 py-2.5 text-[14px]" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9", fontWeight: 600 }}>Fidelia <span className="f-code text-[10px]" style={{ color: "#A79B84" }}>· admin</span></button>
                {students.map((s) => <button key={s.id} onClick={() => onEnterStudent(s)} className="text-left rounded-lg px-4 py-2.5 text-[14px]" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9", fontWeight: 600 }}>{s.name}</button>)}
                {applicants.filter((a) => a.status === "pending").map((a) => <button key={a.id} onClick={() => onEnterApplicant(a)} className="text-left rounded-lg px-4 py-2.5 text-[14px]" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9", fontWeight: 600 }}>{a.name} <span className="f-code text-[10px]" style={{ color: "#A79B84" }}>· pending</span></button>)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export function InReviewScreen({ applicant, onExit }) { return <div className="min-h-screen flex items-center justify-center px-6 text-center"><div className="reveal in max-w-[420px]"><LogoMark height={64} /><div className="f-label text-[13px] mt-6 mb-3 accent-text">APPLICATION IN REVIEW</div><h1 className="f-display text-[30px] mb-4" style={{ fontWeight: 800 }}>Thanks, {applicant.name.split(" ")[0]}.</h1><p className="text-[15px] leading-relaxed mb-8" style={{ color: "#71675A" }}>Your application is being reviewed by the Room. Keep an eye on your email for your code — including your spam/junk folder, just in case.</p><button onClick={onExit} className="f-label text-[12px]" style={{ color: "#A79B84" }}>SIGN OUT</button></div></div>; }
export function CodeRedeemScreen({ student, enrollment, onRedeem, onExit }) {
  const [code, setCode] = useState(""); const [error, setError] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="reveal in max-w-[400px] w-full">
        <LogoMark height={64} /><div className="f-label text-[13px] mt-6 mb-3 accent-text">YOU'RE ACCEPTED</div><h1 className="f-display text-[30px] mb-4" style={{ fontWeight: 800 }}>Enter your access code.</h1>
        <div className="card rounded-2xl p-6 text-left"><div className="f-code text-[11px] mb-4" style={{ color: "#A79B84" }}>STUDENT ID: {student.studentId}</div><Field label="Access code" placeholder="FJ-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} />{error && <div className="text-[12px] mt-2" style={{ color: "#B04A3A" }}>{error}</div>}<button onClick={() => code.trim().toLowerCase() === enrollment.code.toLowerCase() ? onRedeem() : setError("That code doesn't match.")} className="btn-primary rounded-lg py-3 text-[15px] w-full mt-4">Unlock my course</button></div>
        <button onClick={onExit} className="f-label text-[12px] mt-4 block mx-auto" style={{ color: "#A79B84" }}>SIGN OUT</button>
      </div>
    </div>
  );
}
const TOUR_STEPS = [
  { target: null, t: "Welcome to the Room.", d: "Quick tour of where everything actually lives — 30 seconds." },
  { target: "nav-courses", t: "My Courses", d: "Every course you're enrolled in. Click one to resume right where you left off." },
  { target: "nav-explore", t: "Explore More Courses", d: "Apply for another course here, up to two per cohort." },
  { target: "nav-profile", t: "Profile", d: "Your photo, bio, and details — edit them any time." },
  { target: "notif-bell", t: "Notifications", d: "Grading updates, replies, and anything else that needs your attention shows up here." },
];
// A real spotlight tour: dims the page and cuts a highlighted hole around the actual sidebar element for each step,
// with a tooltip anchored next to it — rather than a generic centered "Next, Next, Next" modal.
export function WelcomeTour({ onDone }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const s = TOUR_STEPS[step];

  useEffect(() => {
    function measure() {
      if (!s.target) { setRect(null); return; }
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  const pad = 8;
  const spotStyle = rect ? { position: "fixed", top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: 14, boxShadow: "0 0 0 9999px rgba(38,32,25,.65)", zIndex: 100, pointerEvents: "none", transition: "all .25s cubic-bezier(.22,1,.36,1)" } : { position: "fixed", inset: 0, background: "rgba(38,32,25,.65)", zIndex: 100 };

  const cardTop = rect ? Math.min(rect.bottom + 16, window.innerHeight - 220) : null;
  const cardLeft = rect ? Math.min(rect.left, window.innerWidth - 360) : null;
  const cardStyle = rect
    ? { position: "fixed", top: cardTop, left: cardLeft, zIndex: 101, maxWidth: 340 }
    : { position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" };

  return (
    <>
      <div style={spotStyle} />
      <div style={cardStyle}>
        <div className="card modal-in rounded-2xl p-7" style={{ maxWidth: 340 }}>
          <div className="f-label text-[11px] mb-3 accent-text">STEP {step + 1} OF {TOUR_STEPS.length}</div>
          <div className="f-display text-[21px] mb-2" style={{ fontWeight: 800 }}>{s.t}</div>
          <div className="text-[14px] mb-6" style={{ color: "#71675A" }}>{s.d}</div>
          <div className="flex items-center justify-between">
            <button onClick={onDone} className="text-[13px]" style={{ color: "#A79B84" }}>Skip tour</button>
            <button onClick={() => step < TOUR_STEPS.length - 1 ? setStep(step + 1) : onDone()} className="btn-primary rounded-full px-6 py-2.5 text-[14px]" style={{ fontWeight: 700 }}>{step < TOUR_STEPS.length - 1 ? "Next" : "Let's go"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// =========================================================
// LESSON VIEW
// =========================================================
