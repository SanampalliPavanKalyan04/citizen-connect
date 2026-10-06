import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapPicker from "../components/MapPicker";
import api from "../api";
import { Layout, Icon, StatusBadge, useDepartments, groupDepts } from "../components/ui";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function NewComplaint() {
  const [form, setForm] = useState({
    title: "", category: "", description: "", address: "",
    priority: "MEDIUM", latitude: "", longitude: ""
  });
  const [deptKey, setDeptKey] = useState("");
  const [q, setQ] = useState("");
  const [media, setMedia] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();
  const dt = useDT();
  const depts = useDepartments();
  const [dupes, setDupes] = useState([]);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const dept = depts.find(d => d.key === deptKey);
  const issue = dept?.issues.find(i => i.name === form.category);

  // Search every issue type across all departments (English names and translated department names)
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return depts.flatMap(d => d.issues
      .filter(i => `${i.name} ${d.name} ${dt("dept_" + d.key)} ${t(i.name)}`.toLowerCase().includes(s))
      .map(i => ({ d, i }))).slice(0, 12);
  }, [q, depts]);

  function pickDept(d) {
    setDeptKey(d.key);
    setForm(f => ({ ...f, category: d.issues.length === 1 ? d.issues[0].name : "" }));
  }
  function pickIssue(d, i) {
    setDeptKey(d.key); setQ("");
    setForm(f => ({ ...f, category: i.name }));
  }

  function getGPS() {
    navigator.geolocation.getCurrentPosition(
      p => setForm(f => ({ ...f, latitude: p.coords.latitude, longitude: p.coords.longitude })),
      () => alert("Location permission was not granted.")
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.category) {
      setError("Choose the department and the issue type first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (media && media.size > 4 * 1024 * 1024) {
      setError("Evidence file is too large (max 4 MB). Please use a smaller photo.");
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (media) fd.append("media", media);
    setBusy(true);
    try {
      const { data } = await api.post("/complaints", fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate(`/complaint/${data.id}`, { state: { justCreated: data.complaint_id } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit complaint");
    } finally { setBusy(false); }
  }

  const point = form.latitude && form.longitude
    ? { latitude: Number(form.latitude), longitude: Number(form.longitude) } : null;

  // Warn when an open complaint of the same kind already exists within ~300 m
  useEffect(() => {
    if (!point || !form.category) { setDupes([]); return; }
    const id = setTimeout(() => {
      api.get("/complaints/nearby", { params: { lat: point.latitude, lng: point.longitude, category: form.category } })
        .then(r => setDupes(r.data)).catch(() => setDupes([]));
    }, 400);
    return () => clearTimeout(id);
  }, [form.latitude, form.longitude, form.category]);

  return (
    <Layout title={t("report")} subtitle="Choose the department, then the issue. Your complaint goes straight to the officer responsible.">
      <form onSubmit={submit} className="report">
        {error && <div className="alert">{error}</div>}

        <section className="card">
          <h2><span className="num">1</span> {dt("chooseDept")}</h2>
          <div className="issue-search">
            <Icon name="search" size={18} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={dt("searchIssue")} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear">×</button>}
          </div>
          {q ? (
            <div className="issue-results">
              {matches.map(({ d, i }) => (
                <button type="button" key={d.key + i.name} className="issue-hit" onClick={() => pickIssue(d, i)}>
                  <span>{i.icon}</span>
                  <div><b>{t(i.name)}</b><small>{d.icon} {dt("dept_" + d.key)}</small></div>
                  <Icon name="plus" size={16} />
                </button>
              ))}
              {!matches.length && <p className="muted">No match. Try another word, or pick a department below.</p>}
            </div>
          ) : !depts.length ? <div className="skel w90 tall" /> : groupDepts(depts).map(([g, ds]) => (
            <div className="dept-group" key={g}>
              <h4>{dt("grp_" + g)}</h4>
              <div className="dept-pick">
                {ds.map(d => (
                  <button type="button" key={d.key} className={`dpick ${deptKey === d.key ? "on" : ""}`} onClick={() => pickDept(d)}>
                    <span>{d.icon}</span>{dt("dept_" + d.key)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {dept && (
          <section className="card fade-in" key={dept.key}>
            <h2><span className="num">2</span> {dt("chooseIssue")} <span className="dept-chip">{dept.icon} {dt("dept_" + dept.key)}</span></h2>
            <div className="issue-grid">
              {dept.issues.map(i => (
                <button type="button" key={i.name} className={`issue ${form.category === i.name ? "on" : ""}`}
                  onClick={() => setForm({ ...form, category: i.name })}>
                  <span>{i.icon}</span><b>{t(i.name)}</b><small>{i.sla} {dt("days")}</small>
                </button>
              ))}
            </div>
            {issue && (
              <div className="routed fade-in">
                <span>{dept.icon}</span>
                <div><small>{dt("handledBy")}</small><b>{dt("dept_" + dept.key)}</b></div>
                <div className="routed-sla"><small>{dt("target")}</small><b>{issue.sla} {dt("days")}</b></div>
              </div>
            )}
            <label>Short title<input required value={form.title} onChange={set("title")}
              placeholder={issue ? `e.g. ${t(issue.name)} — ${dept.key === "REVENUE" ? "survey no. 123, Kothakota village" : "near bus stop, MG Road"}` : "Describe the issue in a few words"} /></label>
            <label>Description<textarea required rows="4" value={form.description} onChange={set("description")}
              placeholder={dept.key === "REVENUE" || dept.key === "REGISTRATION"
                ? "Include survey / khata number, village, mandal and what needs to be corrected…"
                : "Describe the issue, how long it has been there, any safety risk…"} /></label>
            <div className="field">
              <span className="lbl">Priority</span>
              <div className="seg">
                {priorities.map(p => (
                  <button type="button" key={p} className={`${form.priority === p ? "on" : ""} p-${p.toLowerCase()}`}
                    onClick={() => setForm({ ...form, priority: p })}>{p}</button>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <h2><span className="num">{dept ? 3 : 2}</span> Where is it?</h2>
          <label>Address, village or mandal<input value={form.address} onChange={set("address")} placeholder="Street / village, mandal, landmark" /></label>
          <div className="loc-row">
            <span className="muted">{point ? `📍 ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : "Tap the map or use your GPS"}</span>
            <button type="button" className="btn btn-ghost" onClick={getGPS}><Icon name="gps" size={18} /> Use my location</button>
          </div>
          <MapPicker value={point} onChange={p => setForm({ ...form, latitude: p.latitude, longitude: p.longitude })} />
          {dupes.length > 0 && (
            <div className="dupe fade-in">
              <b><Icon name="alert" size={16} /> Already reported nearby?</b>
              <p>These open "{t(form.category)}" complaints are close to this spot. If one is the same problem, you can track it instead of filing a new one.</p>
              <ul>{dupes.map(d => (
                <li key={d.complaint_id}><Link to={`/track/${d.complaint_id}`} target="_blank">{d.complaint_id}</Link> · {d.title}
                  <span className="muted"> · {d.distance_m} m away</span> <StatusBadge status={d.status} /></li>
              ))}</ul>
            </div>
          )}
        </section>

        <section className="card">
          <h2><span className="num">{dept ? 4 : 3}</span> Add evidence <span className="muted small">(optional)</span></h2>
          <label className="drop">
            <input type="file" accept="image/*,video/*" onChange={e => setMedia(e.target.files?.[0] || null)} />
            <Icon name="image" size={28} />
            <b>{media ? media.name : "Choose a photo, video or document photo"}</b>
            <small className="muted">JPG, PNG, WEBP, MP4 · up to 4 MB</small>
          </label>
        </section>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/citizen")}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit complaint"}</button>
        </div>
      </form>
    </Layout>
  );
}
