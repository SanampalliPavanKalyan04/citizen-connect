import { useState } from "react";
import { Link } from "react-router-dom";
import api, { API_ORIGIN } from "../api";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
import {
  Layout, StatCard, StatusBadge, PriorityBadge, OverdueBadge, Empty, Icon, Skeleton, LiveTag, DeptChip,
  usePoll, fmtDate, catEmoji, dueText
} from "../components/ui";

export default function EmployeeDashboard() {
  const { t } = useT();
  const dt = useDT();
  const [rows, setRows] = useState(null);
  const [notes, setNotes] = useState({});
  const [at, refresh] = usePoll(() => api.get("/complaints").then(r => setRows(r.data)));

  async function update(c, status) {
    await api.patch(`/complaints/${c.id}/status`, { status, resolution_note: notes[c.id] ?? c.resolution_note ?? "" });
    refresh();
  }

  const list = (rows || []).slice().sort((a, b) => (b.overdue - a.overdue) || (a.status === "RESOLVED") - (b.status === "RESOLVED"));
  const count = s => list.filter(c => c.status === s).length;
  const me = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Layout title={t("tasks")} subtitle={me?.department ? <>{dt("department")}: <b>{dt("dept_" + me.department)}</b> · Resolve field issues and keep citizens updated.</> : "Resolve field issues and keep citizens updated."}
      actions={<LiveTag at={at} onRefresh={refresh} />}>
      <div className="stats">
        <StatCard label={t("assigned")} value={list.length} icon="file" tone="navy" />
        <StatCard label={t("overdue")} value={list.filter(c => c.overdue).length} icon="alert" tone="red" />
        <StatCard label={t("inProgress")} value={count("IN_PROGRESS")} icon="tool" tone="blue" />
        <StatCard label={t("resolved")} value={count("RESOLVED")} icon="check" tone="green" />
      </div>

      {rows === null ? <Skeleton /> :
        list.length === 0 ? <Empty icon="tool" title="No tasks assigned" text="New assignments from the admin will show up here." /> : (
          <div className="c-list two">
            {list.map(c => (
              <article className={`card c-card ${c.overdue ? "is-late" : ""}`} key={c.id}>
                <div className="c-top">
                  <div>
                    <span className="cid">{c.complaint_id}</span>
                    <h3><Link to={`/complaint/${c.id}`}>{catEmoji(c.category)} {c.title}</Link></h3>
                    <div className="meta">
                      <span className="chip">{t(c.category)}</span>
                      <DeptChip c={c} />
                      <PriorityBadge priority={c.priority} />
                      <span className="muted">{fmtDate(c.created_at)}</span>
                    </div>
                  </div>
                  <div className="stack-end"><StatusBadge status={c.status} />{c.overdue && <OverdueBadge />}</div>
                </div>
                <p className="desc">{c.description}</p>
                {c.address && <p className="addr"><Icon name="pin" size={16} /> {c.address}</p>}
                {dueText(c) && <p className={`due ${c.overdue ? "late" : ""}`}><Icon name="clock" size={15} /> {dueText(c)}</p>}
                <div className="c-foot">
                  {c.latitude ? <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"><Icon name="pin" size={16} /> Open in Maps</a> : <span />}
                  {c.media_url && <a href={`${API_ORIGIN}${c.media_url}`} target="_blank" rel="noreferrer"><Icon name="image" size={16} /> Evidence</a>}
                  <Link to={`/complaint/${c.id}`}><Icon name="camera" size={16} /> After photo & timeline</Link>
                </div>
                {c.status !== "RESOLVED" ? (
                  <>
                    <textarea placeholder="Add a work note for the citizen…" value={notes[c.id] ?? c.resolution_note ?? ""}
                      onChange={e => setNotes({ ...notes, [c.id]: e.target.value })} />
                    <div className="btn-row">
                      {c.status !== "IN_PROGRESS" && <button className="btn btn-ghost" onClick={() => update(c, "IN_PROGRESS")}><Icon name="tool" size={16} /> Start work</button>}
                      <button className="btn btn-success" onClick={() => update(c, "RESOLVED")}><Icon name="check" size={16} /> Mark resolved</button>
                    </div>
                  </>
                ) : c.resolution_note && <div className="note"><b>Your note:</b> {c.resolution_note}</div>}
              </article>
            ))}
          </div>
        )}
    </Layout>
  );
}
