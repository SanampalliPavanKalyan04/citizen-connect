import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";

const COLOR = { PENDING: "#d97706", ASSIGNED: "#7c3aed", IN_PROGRESS: "#2563eb", RESOLVED: "#15803d", REJECTED: "#b91c1c" };

export default function HeatMap({ points, height = 420 }) {
  const center = points.length
    ? [points.reduce((a, p) => a + p.lat, 0) / points.length, points.reduce((a, p) => a + p.lng, 0) / points.length]
    : [13.6288, 79.4192];
  return (
    <MapContainer center={center} zoom={points.length ? 12 : 11} className="heatmap" style={{ height }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {/* soft halo gives the "hot spot" glow where complaints cluster */}
      {points.filter(p => p.status !== "RESOLVED" && p.status !== "REJECTED").map(p => (
        <CircleMarker key={`h${p.id}`} center={[p.lat, p.lng]} radius={26} interactive={false}
          pathOptions={{ stroke: false, fillColor: "#ef4444", fillOpacity: 0.12 }} />
      ))}
      {points.map(p => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.overdue ? 9 : 7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: COLOR[p.status] || "#475569", fillOpacity: 0.95 }}>
          <Popup>
            <b>{p.title}</b><br />{p.complaint_id} · {p.category}<br />
            {p.status.replace("_", " ")}{p.overdue ? " · OVERDUE" : ""}<br />
            <Link to={`/complaint/${p.id}`}>Open complaint →</Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export function MapLegend() {
  return (
    <div className="map-legend">
      {Object.entries(COLOR).map(([k, c]) => <span key={k}><i style={{ background: c }} /> {k.replace("_", " ").toLowerCase()}</span>)}
      <span><i className="halo" /> open-issue hotspot</span>
    </div>
  );
}
