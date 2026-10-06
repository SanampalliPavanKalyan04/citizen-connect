import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useT } from "../i18n";
import {
  Layout, StatCard, StatusBadge, PriorityBadge, Progress, Empty, Icon, Stars, Skeleton, LiveTag, DeptChip,
  usePoll, fmtDate, catEmoji, dueText
} from "../components/ui";

export default function CitizenDashboard() {
  const { t } = useT();
  const [complaints, setComplaints] = useState(null);
  const [at, refresh] = usePoll(() => api.get("/complaints").then(r => setComplaints(r.data)));

  const list = complaints || [];
  const count = (...s) => list.filter(c => s.includes(c.status)).length;

  return (
    <Layout title={t("myComplaints")} subtitle="Report civic issues and follow them until they're fixed."
      actions={<><LiveTag at={at} onRefresh={refresh} />
        <Link className="btn btn-primary" to="/citizen/new"><Icon name="plus" size={18} /> {t("report")}</Link></>}>
      <div className="stats">
        <StatCard label={t("total")} value={list.length} icon="file" tone="navy" />
        <StatCard label={t("pending")} value={count("PENDING", "ASSIGNED")} icon="clock" tone="amber" />
        <StatCard label={t("inProgress")} value={count("IN_PROGRESS")} icon="tool" tone="blue" />
        <StatCard label={t("resolved")} value={count("RESOLVED")} icon="check" tone="green" />
      </div>

      {complaints === null ? <Skeleton /> :
        list.length === 0 ? (
          <Empty title="No complaints yet" text="Spotted a problem in your area? Report it in a few taps."
            action={<Link className="btn btn-primary" to="/citizen/new">Report your first issue</Link>} />
        ) : (
          <div className="c-list">
            {list.map(c => (
              <article className="card c-card hoverable" key={c.id}>
                <div className="c-top">
                  <div>
                    <span className="cid">{c.complaint_id}</span>
                    <h3><Link to={`/complaint/${c.id}`} className="stretch">{catEmoji(c.category)} {c.title}</Link></h3>
                    <div className="meta">
                      <span className="chip">{t(c.category)}</span>
                      <DeptChip c={c} />
                      <PriorityBadge priority={c.priority} />
                      <span className="muted">{fmtDate(c.created_at)}</span>
                      {dueText(c) && <span className={`due ${c.overdue ? "late" : ""}`}><Icon name="clock" size={14} /> {dueText(c)}</span>}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                {c.address && <p className="addr"><Icon name="pin" size={16} /> {c.address}</p>}
                <Progress status={c.status} />
                <div className="c-foot">
                  {c.employee ? <span><Icon name="user" size={16} /> Assigned to <b>{c.employee.name}</b></span>
                    : ["PENDING", "ASSIGNED"].includes(c.status) ? <span className="muted">Awaiting assignment</span> : <span />}
                  {c.feedback ? <Stars value={c.feedback.rating} size={16} />
                    : c.status === "RESOLVED" ? <span className="cta-rate"><Icon name="star" size={16} /> {t("rateNow")}</span>
                    : <span className="muted">{t("viewDetails")} →</span>}
                </div>
                {c.resolution_note && <div className="note"><b>Update from the team:</b> {c.resolution_note}</div>}
              </article>
            ))}
          </div>
        )}
    </Layout>
  );
}
