import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { API_ORIGIN } from "../api";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
import {
  Layout, Icon, StatusBadge, PriorityBadge, OverdueBadge, Progress, Stars, Skeleton,
  fmtDateTime, catEmoji, dueText, usePoll, DeptChip, useDepartments, DeptOptions
} from "../components/ui";

export const EVENT_TEXT = {
  SUBMITTED: "Complaint submitted", ASSIGNED: "Assigned to field team", IN_PROGRESS: "Work started",
  RESOLVED: "Marked resolved", REJECTED: "Complaint rejected", PENDING: "Moved back to pending",
  REOPENED: "Reopened by citizen", RATED: "Citizen rated the work", PHOTO: "After-work photo added",
  NOTE: "Update posted", TRANSFERRED: "Moved to another department",
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const created = useLocation().state?.justCreated;
  const { t } = useT();
  const dt = useDT();
  const me = JSON.parse(localStorage.getItem("user") || "null");
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const depts = useDepartments();

  const load = () => api.get(`/complaints/${id}`).then(r => setC(r.data)).catch(e => setErr(e.response?.data?.message || "Not found"));
  usePoll(load, 20000);

  async function act(fn, ok) {
    setBusy(true); setMsg("");
    try { await fn(); setMsg(ok); await load(); }
    catch (e) { setMsg("⚠ " + (e.response?.data?.message || "Something went wrong")); }
    finally { setBusy(false); }
  }

  const back = me?.role === "ADMIN" ? "/admin" : me?.role === "EMPLOYEE" ? "/employee" : "/citizen";
  if (err) return <Layout title="Complaint"><div className="alert">{err}</div><Link to={back}>← Back</Link></Layout>;
  if (!c) return <Layout title="Complaint"><Skeleton rows={2} /></Layout>;

  const canWork = me?.role === "ADMIN" || (me?.role === "EMPLOYEE" && c.employee?.id === me.id);
  const isOwner = me?.role === "CITIZEN";
  const events = c.events.length ? c.events : [{ action: "SUBMITTED", created_at: c.created_at }];

  return (
    <Layout title={<><Link to={back} className="back"><Icon name="back" size={20} /></Link> {catEmoji(c.category)} {c.title}</>}
      subtitle={`${c.complaint_id} · ${t(c.category)} · reported by ${c.citizen?.name || "citizen"}`}
      actions={<div className="stack-end"><StatusBadge status={c.status} />{c.overdue && <OverdueBadge />}</div>}>
      {created && !msg && <div className="toast big-toast"><Icon name="check" /> Complaint submitted! Your ID is <b>&nbsp;{created}&nbsp;</b> — anyone can track it on the home page.</div>}
      {msg && <div className={msg.startsWith("⚠") ? "alert" : "toast"}>{msg}</div>}
      <div className="detail">
        <div className="detail-main">
          <section className="card">
            <Progress status={c.status} />
            <div className="meta mt"><DeptChip c={c} /><PriorityBadge priority={c.priority} />
              {dueText(c) && <span className={`due ${c.overdue ? "late" : ""}`}><Icon name="clock" size={15} /> {dueText(c)}</span>}
              {c.escalated_to && <span className="esc-chip"><Icon name="alert" size={13} /> Escalated to {c.escalated_to}</span>}
            </div>
            <p className="desc big">{c.description}</p>
            {c.address && <p className="addr"><Icon name="pin" size={16} /> {c.address}
              {c.latitude && <> · <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer">Open in Maps</a></>}</p>}
            {c.employee && <p className="addr"><Icon name="user" size={16} /> Assigned to <b>&nbsp;{c.employee.name}</b></p>}
            {c.resolution_note && <div className="note"><b>Latest update:</b> {c.resolution_note}</div>}
            {me?.role === "ADMIN" && (
              <div className="transfer">
                <Icon name="building" size={16} /> <span>{dt("department")}</span>
                <select value={c.department} disabled={busy} onChange={e => act(() => api.patch(`/complaints/${c.id}/department`, { department: e.target.value }), "Department updated.")}>
                  <DeptOptions depts={depts} />
                </select>
                <small className="muted">Moving it unassigns a worker from another department.</small>
              </div>
            )}
          </section>

          {(c.media_url || c.resolution_media_url || canWork) && (
            <section className="card">
              <h2><Icon name="camera" /> Before &amp; after</h2>
              <div className="ba">
                <figure>{c.media_url ? <a href={`${API_ORIGIN}${c.media_url}`} target="_blank" rel="noreferrer"><img src={`${API_ORIGIN}${c.media_url}`} alt="Reported problem" /></a>
                  : <div className="ph">No photo</div>}<figcaption>Before · reported</figcaption></figure>
                <figure>{c.resolution_media_url ? <a href={`${API_ORIGIN}${c.resolution_media_url}`} target="_blank" rel="noreferrer"><img src={`${API_ORIGIN}${c.resolution_media_url}`} alt="After the fix" /></a>
                  : <div className="ph">{canWork ? "Upload a photo of the finished work" : "Awaiting photo"}</div>}<figcaption>After · fixed</figcaption></figure>
              </div>
              {canWork && (
                <label className="btn btn-ghost upload-btn">
                  <Icon name="camera" size={16} /> {c.resolution_media_url ? "Replace after photo" : "Upload after photo"}
                  <input type="file" accept="image/*" hidden disabled={busy} onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 4 * 1024 * 1024) { setMsg("⚠ Photo is larger than 4 MB"); return; }
                    const fd = new FormData(); fd.append("media", f);
                    act(() => api.post(`/complaints/${c.id}/resolution-photo`, fd, { headers: { "Content-Type": "multipart/form-data" } }), "After photo uploaded.");
                  }} />
                </label>
              )}
            </section>
          )}

          {canWork && c.status !== "RESOLVED" && c.status !== "REJECTED" && (
            <section className="card">
              <h2><Icon name="tool" /> Update progress</h2>
              <textarea rows="3" placeholder="What was done? This note is shown to the citizen." value={note} onChange={e => setNote(e.target.value)} />
              <div className="btn-row mt">
                {c.status !== "IN_PROGRESS" && <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => api.patch(`/complaints/${c.id}/status`, { status: "IN_PROGRESS", resolution_note: note || undefined }), "Marked in progress.")}><Icon name="tool" size={16} /> Start work</button>}
                <button className="btn btn-success" disabled={busy} onClick={() => act(() => api.patch(`/complaints/${c.id}/status`, { status: "RESOLVED", resolution_note: note || undefined }), "Marked resolved.")}><Icon name="check" size={16} /> Mark resolved</button>
                {me?.role === "ADMIN" && <button className="btn btn-danger-ghost" disabled={busy} onClick={() => act(() => api.patch(`/complaints/${c.id}/status`, { status: "REJECTED", resolution_note: note || undefined }), "Complaint rejected.")}>Reject</button>}
              </div>
            </section>
          )}

          {isOwner && c.status === "RESOLVED" && !c.feedback && (
            <section className="card rate-card">
              <h2><Icon name="star" /> {t("rateNow")}</h2>
              <p className="muted">How happy are you with how this was fixed?</p>
              <Stars value={rating} onChange={setRating} size={32} />
              <textarea rows="2" className="mt" placeholder="Anything to add? (optional)" value={comment} onChange={e => setComment(e.target.value)} />
              <button className="btn btn-primary mt" disabled={!rating || busy}
                onClick={() => act(() => api.post(`/complaints/${c.id}/feedback`, { rating, comment }), "Thanks for your feedback!")}>Submit rating</button>
            </section>
          )}
          {c.feedback && (
            <section className="card">
              <h2><Icon name="star" /> Citizen rating</h2>
              <Stars value={c.feedback.rating} />
              {c.feedback.comment && <p className="desc mt">“{c.feedback.comment}”</p>}
            </section>
          )}
          {isOwner && (c.status === "RESOLVED" || c.status === "REJECTED") && c.reopens_left === 0 && (
            <section className="card"><p className="muted">This complaint has been reopened the maximum two times, so it can't be reopened again.</p></section>
          )}
          {isOwner && (c.status === "RESOLVED" || c.status === "REJECTED") && c.reopens_left > 0 && (
            <section className="card">
              <h2><Icon name="refresh" /> Not fixed?</h2>
              <p className="muted">Reopen it and say what's still wrong. It will be escalated to the {c.reopen_count === 0 ? "District Officer" : "Head of Department"}. You can reopen {c.reopens_left === 2 ? "twice" : "once more"}.</p>
              <textarea rows="2" placeholder="e.g. The light went off again after two days" value={reason} onChange={e => setReason(e.target.value)} />
              <button className="btn btn-ghost mt" disabled={!reason.trim() || busy}
                onClick={() => act(() => api.post(`/complaints/${c.id}/reopen`, { reason }), "Complaint reopened. The team has been notified.")}>Reopen complaint</button>
            </section>
          )}
        </div>

        <aside className="card detail-side">
          <h2><Icon name="clock" /> Timeline</h2>
          <ol className="timeline">
            {events.map((e, i) => (
              <li key={i} className={`ev-${e.action.toLowerCase()}`}>
                <span className="tl-dot" />
                <div>
                  <b>{EVENT_TEXT[e.action] || e.action}</b>
                  <small>{fmtDateTime(e.created_at)}{e.actor ? ` · ${e.actor.name}` : ""}</small>
                  {e.note && <p>{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </Layout>
  );
}
