import { useEffect, useState } from "react";
import api from "../api";
import "./UsersAdmin.css";
import { Layout, Icon, fmtDate, useDepartments, DeptOptions } from "../components/ui";
import { useDT } from "../deptI18n";
import { useT } from "../i18n";

const ROLES = ["CITIZEN", "EMPLOYEE", "ADMIN"];

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [resetFor, setResetFor] = useState(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const me = JSON.parse(localStorage.getItem("user") || "null");
  const depts = useDepartments();
  const { t } = useT();
  const dt = useDT();

  const load = () => api.get("/admin/users").then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  async function save(u, body, done) {
    setMsg({ ok: true, text: "" });
    try {
      await api.patch(`/admin/users/${u.id}`, body);
      setMsg({ ok: true, text: done });
      load();
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || "Could not update user" });
    }
  }

  async function resetPassword(e, u) {
    e.preventDefault();
    await save(u, { password: pw }, `Password updated for ${u.email}.`);
    setResetFor(null); setPw("");
  }

  const rows = users.filter(u => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout title="Users" subtitle="Change anyone's role or reset their password.">
      {msg.text && <div className={msg.ok ? "toast" : "alert"}>{msg.text}</div>}
      <div className="card">
        <div className="toolbar">
          <div className="muted">{users.length} accounts</div>
          <div className="search"><Icon name="search" size={18} />
            <input placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th><th>{dt("department")}</th><th>Password</th></tr></thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id}>
                  <td><b>{u.name}</b>{me?.id === u.id && <span className="chip you">you</span>}</td>
                  <td>{u.email}</td>
                  <td className="muted">{fmtDate(u.created_at)}</td>
                  <td>
                    <select value={u.role} disabled={me?.id === u.id}
                      onChange={e => save(u, { role: e.target.value }, `${u.email} is now ${e.target.value.toLowerCase()}.`)}>
                      {ROLES.map(r => <option key={r} value={r}>{r[0] + r.slice(1).toLowerCase()}</option>)}
                    </select>
                  </td>
                  <td>
                    {u.role === "CITIZEN" ? <span className="muted small">—</span> : (
                      <select value={u.department || ""} onChange={e => save(u, { department: e.target.value }, `${u.email} moved to ${e.target.value ? dt("dept_" + e.target.value) : "no department"}.`)}>
                        <option value="">No department</option>
                        <DeptOptions depts={depts} />
                      </select>
                    )}
                  </td>
                  <td>
                    {resetFor === u.id ? (
                      <form className="pw-form" onSubmit={e => resetPassword(e, u)}>
                        <input type="password" required minLength="6" autoFocus placeholder="New password"
                          value={pw} onChange={e => setPw(e.target.value)} />
                        <button className="btn btn-primary">Save</button>
                        <button type="button" className="btn btn-ghost" onClick={() => { setResetFor(null); setPw(""); }}>Cancel</button>
                      </form>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => { setResetFor(u.id); setPw(""); }}>Reset password</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
