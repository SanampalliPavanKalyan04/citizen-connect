import { useState } from "react";
import api from "../api";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
import { Layout, StatCard, Skeleton, LiveTag, usePoll, fmtHours, catEmoji } from "../components/ui";
import { DailyChart, BarList, StatusBar } from "../components/Charts";
import HeatMap, { MapLegend } from "../components/HeatMap";

export default function Analytics() {
  const { t } = useT();
  const dt = useDT();
  const [a, setA] = useState(null);
  const [at, refresh] = usePoll(() => api.get("/admin/analytics").then(r => setA(r.data)), 30000);

  return (
    <Layout title={t("analytics")} subtitle="How complaints are flowing, where they are, and how fast they get fixed."
      actions={<LiveTag at={at} onRefresh={refresh} />}>
      {!a ? <Skeleton rows={2} /> : (
        <>
          <div className="stats">
            <StatCard label="Open complaints" value={a.open} icon="file" tone="amber" sub={`${a.total} total`} />
            <StatCard label={t("overdue")} value={a.overdue} icon="alert" tone="red" sub="past target date" />
            <StatCard label={t("statAvg")} value={fmtHours(a.avg_resolution_hours)} icon="clock" tone="blue"
              sub={a.sla_rate != null ? `${a.sla_rate}% within target` : "no resolutions yet"} />
            <StatCard label={t("statRating")} value={a.avg_rating ? `${a.avg_rating} ★` : "—"} icon="star" tone="green" sub={`${a.ratings} ratings`} />
          </div>

          <div className="an-grid">
            <section className="card span-2">
              <h2>{dt("departments")}</h2>
              <div className="table-wrap flush">
                <table className="mini dept-table">
                  <thead><tr><th>{dt("department")}</th><th>Total</th><th>Open</th><th>{t("overdue")}</th><th>{t("resolved")}</th><th>Avg. time</th><th>Staff</th></tr></thead>
                  <tbody>{a.by_department.map(d => (
                    <tr key={d.key}>
                      <td><b>{d.icon} {dt("dept_" + d.key)}</b></td><td>{d.total}</td><td>{d.open}</td>
                      <td>{d.overdue ? <span className="late-num">{d.overdue}</span> : 0}</td><td>{d.resolved}</td>
                      <td>{fmtHours(d.avg_resolution_hours)}</td><td>{d.staff || <span className="muted">none</span>}</td>
                    </tr>))}</tbody>
                </table>
              </div>
            </section>

            <section className="card span-2">
              <h2>Complaints per day <span className="muted small">last 30 days</span></h2>
              <DailyChart data={a.daily} />
            </section>

            <section className="card">
              <h2>Status</h2>
              <StatusBar counts={a.by_status} labels={k => t(k)} />
              <h2 className="mt-lg">By category</h2>
              {a.by_category.length ? (
                <BarList items={a.by_category} labelFn={x => `${catEmoji(x.category)} ${t(x.category)}`}
                  subFn={x => `${x.resolved} resolved${x.overdue ? ` · ${x.overdue} overdue` : ""}`} />
              ) : <p className="muted">No complaints yet.</p>}
            </section>

            <section className="card">
              <h2>Field team performance</h2>
              {a.employees.length ? (
                <table className="mini">
                  <thead><tr><th>Employee</th><th>{dt("department")}</th><th>Assigned</th><th>Open</th><th>Resolved</th><th>Rate</th></tr></thead>
                  <tbody>{a.employees.map(e => (
                    <tr key={e.name}><td><b>{e.name}</b></td><td className="muted small">{e.department || "—"}</td><td>{e.assigned}</td><td>{e.open}</td><td>{e.resolved}</td>
                      <td><div className="rate-bar"><div style={{ width: `${e.assigned ? (100 * e.resolved) / e.assigned : 0}%` }} /></div>
                        <small>{e.assigned ? Math.round((100 * e.resolved) / e.assigned) : 0}%</small></td></tr>
                  ))}</tbody>
                </table>
              ) : <p className="muted">No complaints have been assigned yet.</p>}
            </section>

            <section className="card span-2">
              <h2>Complaint map <span className="muted small">{a.points.length} with a location</span></h2>
              <MapLegend />
              <HeatMap points={a.points} />
            </section>
          </div>
        </>
      )}
    </Layout>
  );
}
