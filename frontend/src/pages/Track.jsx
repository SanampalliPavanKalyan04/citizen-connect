import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useT } from "../i18n";
import { Brand, Icon, StatusBadge, PriorityBadge, Progress, OverdueBadge, ThemeToggle, DeptChip, fmtDateTime, catEmoji, dueText } from "../components/ui";
import { TrackBox } from "./Landing";
import { EVENT_TEXT } from "./ComplaintDetail";

export default function Track() {
  const { code } = useParams();
  const { t } = useT();
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!code) return;
    setC(null); setErr("");
    api.get(`/public/track/${encodeURIComponent(code)}`)
      .then(r => setC(r.data))
      .catch(e => setErr(e.response?.data?.message || "Could not find that complaint"));
  }, [code]);

  return (
    <div className="track-page">
      <header className="l-nav solid">
        <div className="tricolor" />
        <div className="l-nav-in"><Brand light /><div className="l-nav-right"><ThemeToggle /><Link className="btn btn-glass" to="/">{t("home")}</Link></div></div>
      </header>
      <main className="track-main fade-in">
        <h1>{t("trackTitle")}</h1>
        <TrackBox />
        {err && <div className="alert mt">{err}</div>}
        {code && !c && !err && <div className="card mt skel-card"><div className="skel w60 tall" /><div className="skel w90" /></div>}
        {c && (
          <div className="card mt track-card">
            <div className="c-top">
              <div>
                <span className="cid">{c.complaint_id}</span>
                <h2>{catEmoji(c.category)} {c.title}</h2>
                <div className="meta"><span className="chip">{t(c.category)}</span><DeptChip c={c} /><PriorityBadge priority={c.priority} />
                  {c.address && <span className="muted"><Icon name="pin" size={14} /> {c.address}</span>}</div>
              </div>
              <div className="stack-end"><StatusBadge status={c.status} />{c.overdue && <OverdueBadge />}</div>
            </div>
            <Progress status={c.status} />
            {dueText(c) && <p className={`due ${c.overdue ? "late" : ""}`}><Icon name="clock" size={15} /> Target: {dueText(c)}</p>}
            {c.escalated_to && <p><span className="esc-chip"><Icon name="alert" size={13} /> Escalated to {c.escalated_to}</span></p>}
            <h3 className="tl-title">Timeline</h3>
            <ol className="timeline">
              {(c.events.length ? c.events : [{ action: "SUBMITTED", created_at: c.created_at }]).map((e, i) => (
                <li key={i} className={`ev-${e.action.toLowerCase()}`}>
                  <span className="tl-dot" />
                  <div><b>{EVENT_TEXT[e.action] || e.action}</b><small>{fmtDateTime(e.created_at)}</small></div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
