import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../api";
import { useDT } from "../deptI18n";
import { useT, LangSelect } from "../i18n";
import { Brand, Icon, ThemeToggle, CATEGORIES, fmtDate, fmtHours, useDepartments, catEmoji, groupDepts } from "../components/ui";

function Counter({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let raf, start;
    const step = ts => {
      start ??= ts;
      const p = Math.min(1, (ts - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return typeof value === "number" ? n.toLocaleString("en-IN") : value;
}

export function TrackBox({ big }) {
  const { t } = useT();
  const dt = useDT();
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  return (
    <form className={`trackbox ${big ? "big" : ""}`} onSubmit={e => { e.preventDefault(); if (code.trim()) navigate(`/track/${encodeURIComponent(code.trim())}`); }}>
      <Icon name="search" size={20} />
      <input value={code} onChange={e => setCode(e.target.value)} placeholder={t("trackHint")} aria-label={t("trackTitle")} />
      <button className="btn btn-saffron">{t("track")}</button>
    </form>
  );
}

export default function Landing() {
  const { t } = useT();
  const dt = useDT();
  const [s, setS] = useState(null);
  const depts = useDepartments();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => { api.get("/public/stats").then(r => setS(r.data)).catch(() => setS({})); }, []);

  return (
    <div className="landing">
      <header className="l-nav">
        <div className="tricolor" />
        <div className="l-nav-in">
          <Brand light />
          <div className="l-nav-right">
            <LangSelect className="dark" />
            <ThemeToggle />
            {user
              ? <Link className="btn btn-saffron" to="/dashboard">{t("dashboard")}</Link>
              : <><Link className="btn btn-glass" to="/login">{t("signIn")}</Link>
                  <Link className="btn btn-saffron hide-sm" to="/register">{t("register")}</Link></>}
          </div>
        </div>
      </header>

      <section className="l-hero">
        <div className="l-hero-in">
          <div className="l-copy rise">
            <span className="eyebrow"><span className="pulse" /> {s ? `${(s.total || 0).toLocaleString("en-IN")} complaints and counting` : "Live civic dashboard"}</span>
            <h1>{t("heroA")} <span>{t("heroB")}</span></h1>
            <p>{t("heroText")}</p>
            <div className="l-cta">
              <Link className="btn btn-saffron lg" to={user ? "/dashboard" : "/register"}><Icon name="plus" size={18} /> {t("report")}</Link>
              <a className="btn btn-glass lg" href="#track"><Icon name="search" size={18} /> {t("trackTitle")}</a>
            </div>
          </div>
          <div className="l-card rise d2">
            <div className="lc-head"><span className="dot g" /><span className="dot y" /><span className="dot r" /></div>
            {["RESOLVED", "IN_PROGRESS", "ASSIGNED"].map((st, i) => (
              <div className="lc-row" key={st}>
                <span className="lc-emoji">{["💡", "🕳️", "🗑️"][i]}</span>
                <div><b>{["Street light fixed", "Pothole repair", "Garbage pickup"][i]}</b><small>{["Gandhi Nagar", "MG Road", "Market Street"][i]}</small></div>
                <span className={`badge st-${st.toLowerCase()}`}>{t(st)}</span>
              </div>
            ))}
            <div className="lc-foot"><Icon name="check" size={16} /> Every update, in real time</div>
          </div>
        </div>
      </section>

      <section className="l-stats">
        {[
          [t("statTotal"), s?.total, "file"],
          [t("statResolved"), s?.resolved, "check"],
          [t("statAvg"), s ? fmtHours(s.avg_resolution_hours) : null, "clock"],
          [t("statRating"), s?.avg_rating ? `${s.avg_rating} ★` : "—", "star"],
        ].map(([label, v, icon]) => (
          <div className="l-stat" key={label}>
            <Icon name={icon} size={22} />
            <b>{v == null ? <span className="skel w45" /> : <Counter value={v} />}</b>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="l-section" id="track">
        <h2>{t("trackTitle")}</h2>
        <p className="muted">No login needed. Enter the ID you received when you reported the issue.</p>
        <TrackBox big />
      </section>

      <section className="l-section">
        <h2>{t("howTitle")}</h2>
        <div className="how">
          {[["how1", "how1t", "file"], ["how2", "how2t", "users"], ["how3", "how3t", "check"]].map(([h, b, icon], i) => (
            <div className="how-card" key={h}>
              <span className="how-num">{i + 1}</span>
              <div className="how-icon"><Icon name={icon} size={24} /></div>
              <h3>{t(h)}</h3><p>{t(b)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-section">
        <h2>{t("catsTitle")}</h2>
        <p className="muted">{depts.length || 21} departments, {depts.reduce((n, d) => n + d.issues.length, 0) || 60}+ issue types. Each complaint goes straight to the department responsible, with a fixed deadline.</p>
        {groupDepts(depts).map(([g, ds]) => (
          <div key={g} className="l-group">
            <h3 className="grp-title">{dt("grp_" + g)}</h3>
            <div className="l-depts">
              {ds.map(d => (
                <div className="l-dept" key={d.key}>
                  <span className="l-dept-icon">{d.icon}</span>
                  <b>{dt("dept_" + d.key)}</b>
                  <div>{d.issues.slice(0, 3).map(i => <span className="chip" key={i.name}>{i.icon} {t(i.name)}</span>)}
                    {d.issues.length > 3 && <span className="chip more">+{d.issues.length - 3} more</span>}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!depts.length && <div className="l-cats">{CATEGORIES.map(([c, e]) => <div className="l-cat" key={c}><span>{e}</span>{t(c)}</div>)}</div>}
      </section>

      {s?.recent_resolved?.length > 0 && (
        <section className="l-section">
          <h2>{t("recentTitle")}</h2>
          <div className="recent">
            {s.recent_resolved.map((r, i) => (
              <div className="recent-card" key={i}>
                {r.photo ? <img src={`${API_ORIGIN}${r.photo}`} alt="" loading="lazy" /> : <div className="recent-ph">{CATEGORIES.find(c => c[0] === r.category)?.[1] || "✅"}</div>}
                <div className="recent-body">
                  <span className="badge st-resolved">{t("RESOLVED")}</span>
                  <b>{r.title}</b>
                  <small>{r.address || t(r.category)} · {fmtDate(r.resolved_at)}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="l-band">
        <h2>Spotted a problem in your area?</h2>
        <p>It takes less than a minute to report it.</p>
        <Link className="btn btn-saffron lg" to={user ? "/dashboard" : "/register"}>{t("report")}</Link>
      </section>

      <footer className="l-foot">
        <Brand light />
        <small>Citizen Connect · Revolutionising civic services</small>
      </footer>
    </div>
  );
}
