import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthShell } from "./AuthShell";
import { useT } from "../i18n";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.post("/auth/register", form);
      alert("Registration successful. Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setBusy(false); }
  }

  return (
    <AuthShell>
      <form className="auth-form" onSubmit={submit}>
        <h2>Create citizen account</h2>
        <p className="muted">It takes less than a minute.</p>
        {error && <div className="alert">{error}</div>}
        <label>Full name<input required value={form.name} onChange={set("name")} placeholder="Your name" /></label>
        <label>Email address<input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" /></label>
        <label>Phone <span className="muted">(optional)</span><input value={form.phone} onChange={set("phone")} placeholder="+91" /></label>
        <label>Password<input type="password" required minLength="6" value={form.password} onChange={set("password")} placeholder="At least 6 characters" /></label>
        <button className="btn btn-primary full" disabled={busy}>{busy ? "…" : t("register")}</button>
        <p className="switch">{t("haveAccount")} <Link to="/login">{t("signIn")}</Link></p>
      </form>
    </AuthShell>
  );
}
