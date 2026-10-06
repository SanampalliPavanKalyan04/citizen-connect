import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { API_ORIGIN } from "../api";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
import {
  Layout, StatCard, StatusBadge, PriorityBadge, OverdueBadge, Empty, Icon, LiveTag, Skeleton,
  usePoll, useSeen, fmtDate, fmtDateTime, catEmoji, dueText, downloadCSV, DeptChip, useDepartments, DeptOptions
} from "../components/ui";

const STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const PRIO_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function AdminDashboard() {
  const { t } = useT();
  const dt = useDT();
  const [complaints, setComplaints] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [emp, setEmp] = useState({ name: "", email: "", phone: "", password: "", department: "" });
  const depts = useDepartments();
  const [params, setParams] = useSearchParams();
  const dept = params.get("dept") || "";
  const setDept = v => setParams(v ? { dept: v } : {}, { replace: true });
  const [msg, setMsg] = useState("");
  const [isNew, markSeen, firstVisit] = useSeen("seenComplaints");

  const [at, refresh] = usePoll(async () => {
    const [c, e, s] = await Promise.all([api.get("/complaints"), api.get("/employees"), api.get("/admin/stats")]);
    setComplaints(c.data); setEmployees(e.data); setStats(s.data);
  });

  // On the very first visit everything counts as seen, so the badge only marks truly new arrivals
  useEffect(() => { if (complaints && firstVisit) markSeen(complaints.map(c => c.id)); }, [complaints, firstVisit]);
  const list = complaints || [];
  const newCount = list.filter(c => isNew(c.id)).length;

  async function assign(id, employee_id) {
    if (!employee_id) return;
    await api.patch(`/complaints/${id}/assign`, { employee_id: Number(employee_id) });
    refresh();
  }
  async function status(id, status) {
    await api.patch(`/complaints/${id}/status`, { status });
    refresh();
  }
  async function addEmployee(e) {
    e.preventDefault(); setMsg("");
    try {
      await api.post("/employees", emp);
      setEmp({ name: "", email: "", phone: "", password: "", department: "" });
      setShowAdd(false); setMsg("Employee added."); refresh();
    } catch (err) { setMsg(err.response?.data?.message || "Could not add employee"); }
  }

  const tabs = [["ALL", "All"], ["NEW", "New"], ["OVERDUE", t("overdue")], ...STATUSES.map(s => [s, t(s)])];
  const tabCount = k => k === "NEW" ? newCount : k === "OVERDUE" ? list.filter(c => c.overdue).length : list.filter(c => c.status === k).length;

  const rows = useMemo(() => {
    const r = list.filter(c =>
      (tab === "ALL" || (tab === "NEW" ? isNew(c.id) : tab === "OVERDUE" ? c.overdue : c.status === tab)) &&
      (!dept || c.department === dept) &&
      (!q || `${c.complaint_id} ${c.title} ${c.category} ${c.address || ""} ${c.citizen?.name || ""}`.toLowerCase().includes(q.toLowerCase())));
    if (sort === "priority") r.sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
    if (sort === "due") r.sort((a, b) => (b.overdue - a.overdue) || (new Date(a.due_at) - new Date(b.due_at)));
    return r;
  }, [list, tab, q, sort, isNew, dept]);

  function exportCSV() {
    downloadCSV(`complaints-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Complaint ID", "Title", "Category", "Department", "Priority", "Status", "Overdue", "Citizen", "Citizen email", "Assigned to",
        "Address", "Latitude", "Longitude", "Created", "Resolved", "Rating", "Note"],
      ...rows.map(c => [c.complaint_id, c.title, c.category, c.department_name, c.priority, c.status, c.overdue ? "Yes" : "No",
        c.citizen?.name, c.citizen?.email, c.employee?.name || "", c.address || "", c.latitude ?? "", c.longitude ?? "",
        fmtDateTime(c.created_at), fmtDateTime(c.resolved_at), c.feedback?.rating ?? "", c.resolution_note || ""]),
    ]);
  }

  return (
    <Layout title="Complaint Management" subtitle="Review incoming complaints, assign field staff and track resolution."
      actions={<>
        <LiveTag at={at} onRefresh={refresh} />
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!rows.length}><Icon name="download" size={18} /> Export</button>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}><Icon name="users" size={18} /> Add Employee</button>
      </>}>
      <div className="stats">
        <StatCard label={t("total")} value={stats.total || 0} icon="file" tone="navy" sub={newCount ? `${newCount} new` : undefined} />
        <StatCard label={t("pending")} value={stats.pending || 0} icon="clock" tone="amber" />
        <StatCard label={t("overdue")} value={stats.overdue || 0} icon="alert" tone="red" />
        <StatCard label={t("resolved")} value={stats.resolved || 0} icon="check" tone="green" />
      </div>

      {msg && <div className="toast">{msg}</div>}
      {showAdd && (
        <form className="card add-emp" onSubmit={addEmployee}>
          <h2>New field employee</h2>
          <div className="grid-4 g5">
            <input required placeholder="Full name" value={emp.name} onChange={e => setEmp({ ...emp, name: e.target.value })} />
            <input required type="email" placeholder="Email" value={emp.email} onChange={e => setEmp({ ...emp, email: e.target.value })} />
            <input placeholder="Phone" value={emp.phone} onChange={e => setEmp({ ...emp, phone: e.target.value })} />
            <input required type="password" minLength="6" placeholder="Temporary password" value={emp.password} onChange={e => setEmp({ ...emp, password: e.target.value })} />
            <select required value={emp.department} onChange={e => setEmp({ ...emp, department: e.target.value })}>
              <option value="">Department…</option>
              <DeptOptions depts={depts} />
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary">Save employee</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            {tabs.map(([k, l]) => (
              <button key={k} className={`${tab === k ? "on" : ""} ${k === "NEW" && newCount ? "has-new" : ""}`} onClick={() => setTab(k)}>
                {l}{k !== "ALL" && <em>{tabCount(k)}</em>}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select className="sort" value={dept} onChange={e => setDept(e.target.value)} aria-label={dt("department")}>
              <option value="">All departments</option>
              <DeptOptions depts={depts} />
            </select>
            <select className="sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
              <option value="newest">Newest first</option>
              <option value="due">Most urgent deadline</option>
              <option value="priority">Highest priority</option>
            </select>
            <div className="search"><Icon name="search" size={18} />
              <input placeholder="Search ID, title, area, citizen…" value={q} onChange={e => setQ(e.target.value)} /></div>
          </div>
        </div>
        {newCount > 0 && tab !== "NEW" && (
          <div className="new-strip">{newCount} new complaint{newCount > 1 ? "s" : ""} since your last visit
            <button onClick={() => markSeen(list.map(c => c.id))}>Mark all as seen</button></div>
        )}

        {complaints === null ? <Skeleton rows={2} /> : rows.length === 0 ? <Empty icon="list" title="No complaints here" text="Try another tab or search." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Complaint</th><th>Category / {dt("department")}</th><th>Priority</th><th>Deadline</th><th>Citizen</th><th>Assign to</th><th>Status</th>
              </tr></thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} className={`${isNew(c.id) ? "row-new" : ""} ${c.overdue ? "row-late" : ""}`}>
                    <td>
                      <Link className="t-title" to={`/complaint/${c.id}`} onClick={() => markSeen([c.id])}>{c.title}</Link>
                      {isNew(c.id) && <span className="new-badge">NEW</span>}
                      <div className="t-sub">{c.complaint_id} · {fmtDate(c.created_at)}
                        {c.media_url && <> · <a href={`${API_ORIGIN}${c.media_url}`} target="_blank" rel="noreferrer">photo</a></>}
                        {c.feedback && <> · {c.feedback.rating}★</>}
                      </div>
                      {c.address && <div className="t-sub"><Icon name="pin" size={13} /> {c.address}</div>}
                    </td>
                    <td><div className="cat-dept"><span className="chip">{catEmoji(c.category)} {t(c.category)}</span><DeptChip c={c} /></div></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td>{c.overdue ? <OverdueBadge /> : <span className="muted small">{dueText(c) || "—"}</span>}</td>
                    <td>{c.citizen?.name}</td>
                    <td>
                      <select value={c.employee?.id || ""} onChange={e => assign(c.id, e.target.value)}>
                        <option value="">Select employee</option>
                        {(() => {
                          const mine = employees.filter(e => e.department === c.department);
                          const others = employees.filter(e => e.department !== c.department);
                          return <>
                            {mine.length > 0 && <optgroup label={dt("dept_" + c.department)}>{mine.map(e => <option value={e.id} key={e.id}>{e.name}</option>)}</optgroup>}
                            {others.length > 0 && <optgroup label={mine.length ? "Other departments" : "All staff"}>{others.map(e => <option value={e.id} key={e.id}>{e.name}{e.department_name ? ` · ${e.department_name}` : ""}</option>)}</optgroup>}
                          </>;
                        })()}
                      </select>
                    </td>
                    <td>
                      <div className="st-cell">
                        <StatusBadge status={c.status} />
                        <select value={c.status} onChange={e => status(c.id, e.target.value)}>
                          {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
