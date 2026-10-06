import { Routes, Route, Navigate } from "react-router-dom";
import { LangProvider, useTheme } from "./i18n";
import "./extra.css";
import "./depts.css";
import Landing from "./pages/Landing";
import Track from "./pages/Track";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import NewComplaint from "./pages/NewComplaint";
import ComplaintDetail from "./pages/ComplaintDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import UsersAdmin from "./pages/UsersAdmin";
import Departments from "./pages/Departments";
import EmployeeDashboard from "./pages/EmployeeDashboard";

const getUser = () => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } };

function Protected({ children, roles }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Read the user on every visit (not once at startup), so switching
// accounts after logout lands on the right dashboard.
function Dashboard() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "EMPLOYEE") return <Navigate to="/employee" replace />;
  return <Navigate to="/citizen" replace />;
}

export default function App() {
  useTheme(); // apply the saved light/dark theme on load
  return (
    <LangProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:code" element={<Track />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/citizen" element={<Protected roles={["CITIZEN"]}><CitizenDashboard /></Protected>} />
        <Route path="/citizen/new" element={<Protected roles={["CITIZEN"]}><NewComplaint /></Protected>} />
        <Route path="/complaint/:id" element={<Protected><ComplaintDetail /></Protected>} />
        <Route path="/admin" element={<Protected roles={["ADMIN"]}><AdminDashboard /></Protected>} />
        <Route path="/admin/analytics" element={<Protected roles={["ADMIN"]}><Analytics /></Protected>} />
        <Route path="/admin/departments" element={<Protected roles={["ADMIN"]}><Departments /></Protected>} />
        <Route path="/admin/users" element={<Protected roles={["ADMIN"]}><UsersAdmin /></Protected>} />
        <Route path="/employee" element={<Protected roles={["EMPLOYEE"]}><EmployeeDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LangProvider>
  );
}
