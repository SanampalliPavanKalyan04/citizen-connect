import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthShell } from "./AuthShell";
import { useT } from "../i18n";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();

  useEffect(() => {
    api.get("/health").then(r => setDemo(!!r.data.demo)).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setBusy(false); }
  }

  const fill = (email, password) => setForm({ email, password });

  return (
    <AuthShell>
      <form className="auth-form" onSubmit={submit}>
        <h2>{t("welcome")}</h2>
        <p className="muted">{t("signInSub")}</p>
        {error && <div className="alert">{error}</div>}
        <label>{t("email")}
          <input type="email" required placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>{t("password")}
          <input type="password" required placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </label>
        <button className="btn btn-primary full" disabled={busy}>{busy ? "…" : t("signIn")}</button>
        <p className="switch">{t("newCitizen")} <Link to="/register">{t("register")}</Link></p>
        {demo && (
          <div className="demo">
            <b>Demo accounts</b> <span className="muted">(click to fill)</span>
            <div className="demo-row">
              <button type="button" onClick={() => fill("citizen@citizenconnect.com", "citizen123")}>Citizen</button>
              <button type="button" onClick={() => fill("admin@citizenconnect.com", "admin123")}>Admin</button>
              <button type="button" onClick={() => fill("employee@citizenconnect.com", "employee123")}>Employee</button>
            </div>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
