import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDT } from "../deptI18n";
import { useT, LangSelect, useTheme } from "../i18n";

const P = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  plus: "M12 5v14M5 12h14",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  check: "M20 6 9 17l-5-5",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  users: "M17 21a6 6 0 0 0-12 0M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21a5 5 0 0 0-4-4.9M16 3.1a4 4 0 0 1 0 7.8",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  shield: "M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z",
  image: "M4 5h16v14H4zM4 15l4-4 5 5M14 14l2-2 4 4M15 9h.01",
  gps: "M12 2v3M12 19v3M2 12h3M19 12h3M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  chart: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  back: "M19 12H5M12 19l-7-7 7-7",
  map: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4zM8 2v16M16 6v16",
  building: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
};

export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

export const CATEGORIES = [
  ["Pothole", "🕳️"], ["Garbage", "🗑️"], ["Street Light", "💡"], ["Water", "🚰"],
  ["Drainage", "🌊"], ["Electricity", "⚡"], ["Road Cleaning", "🧹"], ["Other", "📋"],
];
export const catEmoji = c => {
  for (const d of deptCache || []) { const i = d.issues?.find(x => x.name === c); if (i) return i.icon; }
  return (CATEGORIES.find(x => x[0] === c) || [, "📋"])[1];
};

// Departments come from the API once and are shared by every screen
let deptCache = null, deptPromise = null;
export function useDepartments() {
  const [d, setD] = useState(deptCache || []);
  useEffect(() => {
    if (deptCache) return;
    deptPromise ??= fetch((import.meta.env.VITE_API_URL || "/api") + "/departments").then(r => r.json()).then(x => (deptCache = x));
    deptPromise.then(setD).catch(() => {});
  }, []);
  return d;
}
export const deptOf = (depts, category) => depts.find(d => d.categories.includes(category));
export const issueOf = (depts, category) => { for (const d of depts) { const i = d.issues?.find(x => x.name === category); if (i) return i; } return null; };
// [[group, [dept, ...]], ...] in the order the API lists them
export const groupDepts = depts => depts.reduce((acc, d) => {
  const g = acc.find(x => x[0] === d.group);
  g ? g[1].push(d) : acc.push([d.group, [d]]);
  return acc;
}, []);

// <option>s for a department <select>, grouped like PGRS
export function DeptOptions({ depts }) {
  const dt = useDT();
  return groupDepts(depts).map(([g, ds]) => (
    <optgroup key={g} label={dt("grp_" + g)}>
      {ds.map(d => <option key={d.key} value={d.key}>{d.icon} {dt("dept_" + d.key)}</option>)}
    </optgroup>
  ));
}

export function DeptChip({ c }) {
  const { t } = useT();
  const dt = useDT();
  const depts = useDepartments();
  const key = c?.department;
  if (!key) return null;
  const d = depts.find(x => x.key === key);
  return <span className="dept-chip" title="Responsible department">{d?.icon || "🏛️"} {dt("dept_" + key)}</span>;
}

export function StatusBadge({ status }) {
  const { t } = useT();
  const dt = useDT();
  return <span className={`badge st-${status.toLowerCase()}`}>{t(status)}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`prio pr-${priority.toLowerCase()}`}>{priority}</span>;
}

export function OverdueBadge() {
  const { t } = useT();
  const dt = useDT();
  return <span className="overdue-badge"><Icon name="alert" size={13} /> {t("overdue")}</span>;
}

const STEPS = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
export function Progress({ status }) {
  const { t } = useT();
  const dt = useDT();
  if (status === "REJECTED") return <div className="steps rejected">{t("REJECTED")}</div>;
  const idx = STEPS.indexOf(status);
  return (
    <div className="steps">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i <= idx ? "done" : ""}`}>
          <span className="dot">{i < idx || status === "RESOLVED" ? <Icon name="check" size={12} /> : i + 1}</span>
          <small>{t(s)}</small>
        </div>
      ))}
    </div>
  );
}

export function StatCard({ label, value, icon, tone, sub }) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-icon"><Icon name={icon} size={22} /></div>
      <div><span>{label}</span><b>{value}</b>{sub && <small className="stat-sub">{sub}</small>}</div>
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={`stars ${onChange ? "editable" : ""}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button type="button" key={n} disabled={!onChange} aria-label={`${n} star`}
          className={n <= shown ? "on" : ""} onMouseEnter={() => onChange && setHover(n)} onClick={() => onChange?.(n)}>
          <svg width={size} height={size} viewBox="0 0 24 24"><path d={P.star} /></svg>
        </button>
      ))}
    </div>
  );
}

export function Brand({ light }) {
  const { t } = useT();
  const dt = useDT();
  return (
    <Link to="/" className={`brand ${light ? "light" : ""}`}>
      <div className="emblem"><Icon name="shield" size={20} /></div>
      <div><strong>Citizen Connect</strong><small>{t("tagline")}</small></div>
    </Link>
  );
}

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <button className="icon-btn" onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"} aria-label="Toggle dark mode">
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}

const NAV = {
  CITIZEN: [
    { to: "/citizen", key: "myComplaints", icon: "home", end: true },
    { to: "/citizen/new", key: "report", icon: "plus" },
  ],
  ADMIN: [
    { to: "/admin", key: "allComplaints", icon: "list", end: true },
    { to: "/admin/departments", key: "departments", icon: "building" },
    { to: "/admin/analytics", key: "analytics", icon: "chart" },
    { to: "/admin/users", key: "users", icon: "users" },
  ],
  EMPLOYEE: [{ to: "/employee", key: "tasks", icon: "tool" }],
};

export function Layout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { t } = useT();
  const dt = useDT();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };
  const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="tricolor" />
        <Brand light />
        <nav>
          {(NAV[user?.role] || []).map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-item">
              <Icon name={n.icon} /> <span>{n.key === "departments" ? dt("departments") : t(n.key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-tools"><LangSelect className="dark" /><ThemeToggle /></div>
          <div className="me">
            <div className="avatar">{initials}</div>
            <div><b>{user?.name}</b><small>{user?.role?.toLowerCase()}</small></div>
          </div>
          <button className="nav-item logout" onClick={logout}><Icon name="logout" /> <span>{t("logout")}</span></button>
        </div>
      </aside>
      <main className="main fade-in">
        <header className="page-head">
          <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          {actions && <div className="head-actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}

export function Empty({ icon = "file", title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>{text && <p>{text}</p>}{action}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="c-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="card skel-card" key={i}>
          <div className="skel w30" /><div className="skel w60 tall" /><div className="skel w90" /><div className="skel w45" />
        </div>
      ))}
    </div>
  );
}

// Re-fetch every `ms` while the tab is visible; returns [lastUpdated, refreshNow]
export function usePoll(fn, ms = 15000) {
  const ref = useRef(fn);
  ref.current = fn;
  const [at, setAt] = useState(null);
  const run = () => Promise.resolve(ref.current()).then(() => setAt(new Date())).catch(() => {});
  useEffect(() => {
    run();
    const id = setInterval(() => { if (!document.hidden) run(); }, ms);
    const onVis = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [ms]);
  return [at, run];
}

export function LiveTag({ at, onRefresh }) {
  const { t } = useT();
  const dt = useDT();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 5000); return () => clearInterval(id); }, []);
  return (
    <button className="live" onClick={onRefresh} title="Refresh now">
      <span className="pulse" /> {t("live")} · {at ? timeAgo(at) : "…"} <Icon name="refresh" size={14} />
    </button>
  );
}

export function timeAgo(d) {
  const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

// The API stores UTC without a zone marker; treat it as UTC.
export const toDate = d => d ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? d : d + "Z") : null;
export const fmtDate = d => d ? toDate(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
export const fmtDateTime = d => d ? toDate(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
export const fmtHours = h => h == null ? "—" : h < 24 ? `${Math.round(h)} h` : `${(h / 24).toFixed(1)} days`;

export function dueText(c) {
  if (!c.due_at || c.status === "RESOLVED" || c.status === "REJECTED") return null;
  const ms = toDate(c.due_at) - Date.now();
  const d = Math.round(Math.abs(ms) / 36e5);
  const txt = d >= 48 ? `${Math.round(d / 24)} days` : `${d} h`;
  return ms < 0 ? `${txt} overdue` : `due in ${txt}`;
}

export function downloadCSV(filename, rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Remembers which complaint IDs this browser has already seen (for "New" badges)
export function useSeen(key) {
  const read = () => { try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set(); } };
  const [seen, setSeen] = useState(read);
  const [first, setFirst] = useState(() => { try { return !localStorage.getItem(key); } catch { return true; } });
  const markAll = ids => {
    const s = new Set([...seen, ...ids]);
    setSeen(s); setFirst(false);
    try { localStorage.setItem(key, JSON.stringify([...s].slice(-2000))); } catch {}
  };
  const isNew = id => !first && !seen.has(id);
  return [isNew, markAll, first];
}
