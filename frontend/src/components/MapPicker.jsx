import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";

function Picker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    }
  });
  return value ? <Marker position={[value.latitude, value.longitude]} /> : null;
}

export default function MapPicker({ value, onChange }) {
  const fallback = { latitude: 13.6288, longitude: 79.4192 };
  const center = value ? [value.latitude, value.longitude] : [fallback.latitude, fallback.longitude];

  return (
    <MapContainer center={center} zoom={13} className="map">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Picker value={value} onChange={onChange} />
    </MapContainer>
  );
}
