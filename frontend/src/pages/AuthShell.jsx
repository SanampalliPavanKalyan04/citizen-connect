import { Link } from "react-router-dom";
import { Brand, Icon, ThemeToggle } from "../components/ui";
import { useT, LangSelect } from "../i18n";

export function AuthShell({ children }) {
  const { t } = useT();
  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="tricolor" />
        <Brand light />
        <div className="hero-copy">
          <h1>{t("heroA")} <span>{t("heroB")}</span></h1>
          <p>{t("heroText")}</p>
          <ul>
            <li><Icon name="pin" /> Pin the exact location on a map</li>
            <li><Icon name="image" /> Attach photo evidence</li>
            <li><Icon name="clock" /> Follow live status updates</li>
          </ul>
        </div>
        <small className="hero-foot">Citizen Connect · Revolutionising civic services</small>
      </section>
      <section className="auth-panel">
        <div className="auth-top"><Link to="/" className="muted">← {t("home")}</Link><div className="side-tools"><LangSelect /><ThemeToggle /></div></div>
        {children}
        <Link to="/#track" className="auth-track"><Icon name="search" size={16} /> {t("trackTitle")} without logging in</Link>
      </section>
    </div>
  );
}
