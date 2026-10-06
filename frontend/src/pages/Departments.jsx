import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
import { Layout, Icon, Skeleton, LiveTag, usePoll, fmtHours, catEmoji, useDepartments, groupDepts } from "../components/ui";

export default function Departments() {
  const { t } = useT();
  const dt = useDT();
  const depts = useDepartments();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [at, refresh] = usePoll(async () => {
    const [a, u] = await Promise.all([api.get("/admin/analytics"), api.get("/admin/users")]);
    setStats(Object.fromEntries(a.data.by_department.map(d => [d.key, d])));
    setUsers(u.data.filter(x => x.role === "EMPLOYEE"));
  }, 30000);
  const unassigned = users.filter(u => !u.department);

  return (
    <Layout title={dt("departments")} subtitle="Every complaint is routed to a department by its category. Staff belong to a department."
      actions={<LiveTag at={at} onRefresh={refresh} />}>
      {unassigned.length > 0 && (
        <div className="new-strip">{unassigned.length} employee{unassigned.length > 1 ? "s have" : " has"} no department yet ({unassigned.map(u => u.name).join(", ")})
          <Link to="/admin/users">Set in Users →</Link></div>
      )}
      {!stats || !depts.length ? <Skeleton rows={2} /> : (
        groupDepts(depts).map(([g, ds]) => <div key={g} className="dept-section"><h3 className="grp-title">{dt("grp_" + g)}</h3>
        <div className="dept-grid">
          {ds.map(d => {
            const s = stats[d.key] || {};
            const staff = users.filter(u => u.department === d.key);
            const load = s.open && staff.length ? (s.open / staff.length).toFixed(1) : null;
            return (
              <section className={`card dept-card ${s.overdue ? "has-late" : ""}`} key={d.key}>
                <div className="dept-head">
                  <span className="dept-icon">{d.icon}</span>
                  <div><h2>{dt("dept_" + d.key)}</h2>
                    <div className="dept-cats">{d.issues.map(i => <span className="chip" key={i.name} title={`Target: ${i.sla} days`}>{i.icon} {t(i.name)} <em className="sla">{i.sla}d</em></span>)}</div></div>
                </div>
                <div className="dept-nums">
                  <div><b>{s.open ?? 0}</b><small>Open</small></div>
                  <div className={s.overdue ? "late" : ""}><b>{s.overdue ?? 0}</b><small>{t("overdue")}</small></div>
                  <div><b>{s.resolved ?? 0}</b><small>{t("resolved")}</small></div>
                  <div><b>{fmtHours(s.avg_resolution_hours)}</b><small>Avg. time</small></div>
                </div>
                <div className="dept-staff">
                  <Icon name="users" size={16} />
                  {staff.length ? <span>{staff.map(u => u.name).join(", ")}{load && <span className="muted"> · {load} open per person</span>}</span>
                    : <span className="warn-text">No staff yet. Add an employee to this department.</span>}
                </div>
                <Link className="btn btn-ghost" to={`/admin?dept=${d.key}`}><Icon name="list" size={16} /> View complaints</Link>
              </section>
            );
          })}
        </div></div>)
      )}
    </Layout>
  );
}
