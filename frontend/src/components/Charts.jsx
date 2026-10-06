import { useState } from "react";

// Daily columns: two series side by side, with a hover tooltip per day.
export function DailyChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 220, pad = { l: 30, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...data.map(d => Math.max(d.created, d.resolved)));
  const nice = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const slot = iw / data.length, bw = Math.max(2, Math.min(9, slot / 2 - 2));
  const y = v => pad.t + ih - (v / nice) * ih;
  const ticks = nice <= 4 ? Array.from({ length: nice + 1 }, (_, i) => i) : [0, nice / 4, nice / 2, (3 * nice) / 4, nice];
  const label = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span><i className="sw created" /> Received</span>
        <span><i className="sw resolved" /> Resolved</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Complaints received and resolved per day, last 30 days">
        {ticks.map(tk => (
          <g key={tk}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tk)} y2={y(tk)} className="grid" />
            <text x={pad.l - 6} y={y(tk) + 4} className="axis" textAnchor="end">{tk}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * slot + slot / 2;
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={ih} className={`hit ${hover === i ? "on" : ""}`} />
              {d.created > 0 && <rect x={x - bw - 1} y={y(d.created)} width={bw} height={pad.t + ih - y(d.created)} rx="2" className="bar created" />}
              {d.resolved > 0 && <rect x={x + 1} y={y(d.resolved)} width={bw} height={pad.t + ih - y(d.resolved)} rx="2" className="bar resolved" />}
              {((i % 7 === 0 && i < data.length - 4) || i === data.length - 1) &&
                <text x={x} y={H - 8} className="axis" textAnchor={i === data.length - 1 ? "end" : "middle"}>{label(d.date)}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${((pad.l + hover * slot + slot / 2) / W) * 100}%` }}>
          <b>{label(data[hover].date)}</b>
          <span><i className="sw created" /> {data[hover].created} received</span>
          <span><i className="sw resolved" /> {data[hover].resolved} resolved</span>
        </div>
      )}
    </div>
  );
}

// Horizontal bars for one measure, with the value printed at the end.
export function BarList({ items, valueKey = "total", labelFn = x => x.label, subFn }) {
  const max = Math.max(1, ...items.map(i => i[valueKey]));
  return (
    <div className="barlist">
      {items.map((it, idx) => (
        <div className="bl-row" key={idx} title={subFn ? subFn(it) : undefined}>
          <span className="bl-label">{labelFn(it)}</span>
          <div className="bl-track"><div className="bl-fill" style={{ width: `${(it[valueKey] / max) * 100}%` }} /></div>
          <b className="bl-val">{it[valueKey]}</b>
          {subFn && <small className="bl-sub">{subFn(it)}</small>}
        </div>
      ))}
    </div>
  );
}

// One stacked bar showing the share of each status, labelled below.
export function StatusBar({ counts, labels }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const keys = Object.keys(counts).filter(k => counts[k] > 0);
  return (
    <div>
      <div className="stackbar">
        {keys.map(k => <div key={k} className={`seg-${k.toLowerCase()}`} style={{ width: `${(counts[k] / total) * 100}%` }}
          title={`${labels(k)}: ${counts[k]}`} />)}
      </div>
      <div className="stack-legend">
        {Object.keys(counts).map(k => (
          <span key={k}><i className={`sw seg-${k.toLowerCase()}`} /> {labels(k)} <b>{counts[k]}</b></span>
        ))}
      </div>
    </div>
  );
}
