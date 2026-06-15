import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");
const WS_API = import.meta.env.VITE_WS_URL
  || (API ? API.replace(/^http/, "ws") : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`);

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`;

const RISK = {
  HIGH:   { color: "#e8431a", dim: "#e8431a22", label: "#f87a5a" },
  MEDIUM: { color: "#d4961a", dim: "#d4961a22", label: "#f5bc4a" },
  LOW:    { color: "#2ea87e", dim: "#2ea87e22", label: "#4dcfa4" },
};

const EVT_LABEL = {
  motion_detected:   "Motion",
  vehicle_detected:  "Vehicle",
  drone_signal_loss: "Drone Loss",
  thermal_anomaly:   "Thermal",
  perimeter_breach:  "Breach",
  unknown_signal:    "Unknown",
};

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #141414; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ripple {
    0%   { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .fade-in { animation: fadeSlideIn 0.35s ease both; }

  .sim-btn {
    background: #c8860a;
    color: #0d0d0d;
    border: none;
    padding: 10px 28px;
    border-radius: 4px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .sim-btn:hover  { background: #e09a12; }
  .sim-btn:active { transform: scale(0.97); }
  .sim-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; }

  .inc-row {
    border-bottom: 1px solid #222;
    padding: 14px 20px;
    cursor: pointer;
    transition: background 0.12s;
  }
  .inc-row:hover { background: #1a1a1a; }
  .inc-row.active { background: #1c1811; border-left: 2px solid #c8860a; }
`;

function Dot({ color, pulse }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
      {pulse && <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "ripple 1.8s ease-out infinite" }} />}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, position: "relative" }} />
    </span>
  );
}

function RiskPill({ level }) {
  const r = RISK[level] || RISK.LOW;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
      padding: "3px 9px", borderRadius: 3,
      background: r.dim, color: r.label,
      fontFamily: "'DM Mono', monospace",
      border: `1px solid ${r.color}33`,
    }}>{level}</span>
  );
}

function ScoreRing({ score, level }) {
  const r = RISK[level] || RISK.LOW;
  const c = 2 * Math.PI * 38;
  const fill = (score / 100) * c;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={38} fill="none" stroke="#222" strokeWidth={6} />
      <circle cx={50} cy={50} r={38} fill="none" stroke={r.color} strokeWidth={6}
        strokeDasharray={`${fill} ${c - fill}`}
        strokeDashoffset={c * 0.25}
        strokeLinecap="round" />
      <text x={50} y={47} textAnchor="middle" fill={r.label}
        fontSize={22} fontWeight={600} fontFamily="'DM Mono', monospace">{score}</text>
      <text x={50} y={62} textAnchor="middle" fill="#555"
        fontSize={9} fontFamily="'DM Sans', sans-serif" letterSpacing={1}>{level} RISK</text>
    </svg>
  );
}

function StatCard({ label, value, sub, accent = "#c8860a" }) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 6, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: accent, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#444", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
    </div>
  );
}

function IncidentRow({ inc, selected, onClick }) {
  const r = RISK[inc.risk?.level] || RISK.LOW;
  const time = new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`inc-row${selected ? " active" : ""}`} onClick={onClick}
      style={{ borderLeft: selected ? undefined : "2px solid transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#444" }}>{inc.id}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RiskPill level={inc.risk?.level} />
          <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'DM Mono', monospace" }}>{time}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5, marginBottom: 8 }}>
        {inc.analysis?.summary || "Processing analysis…"}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {inc.events?.slice(0, 4).map((e, i) => (
          <span key={i} style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 3,
            background: "#222", color: "#555",
            fontFamily: "'DM Mono', monospace"
          }}>{EVT_LABEL[e.type] || e.type} · {e.zone}</span>
        ))}
      </div>
    </div>
  );
}

function AnalysisDetail({ inc }) {
  if (!inc) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
      <svg width={48} height={48} viewBox="0 0 48 48" fill="none">
        <rect x={4} y={4} width={40} height={40} rx={4} stroke="#2a2a2a" strokeWidth={1.5} />
        <path d="M16 24h16M16 30h10" stroke="#333" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={24} cy={17} r={4} stroke="#333" strokeWidth={1.5} />
      </svg>
      <p style={{ fontSize: 12, color: "#333", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>Select an incident to analyse</p>
    </div>
  );

  const r = RISK[inc.risk?.level] || RISK.LOW;

  return (
    <div style={{ padding: "24px 24px", overflowY: "auto", height: "100%" }} className="fade-in">
      {/* Score + ID header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: 6 }}>INCIDENT</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#e0e0e0", fontFamily: "'DM Mono', monospace" }}>{inc.id}</div>
          <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
            {new Date(inc.timestamp).toLocaleString()}
          </div>
        </div>
        <ScoreRing score={inc.risk?.score || 0} level={inc.risk?.level || "LOW"} />
      </div>

      {/* AI Summary */}
      <Section label="SUMMARY">
        <p style={{ fontSize: 14, color: "#bbb", lineHeight: 1.7 }}>{inc.analysis?.summary}</p>
      </Section>

      {/* Threat assessment */}
      <Section label="THREAT ASSESSMENT" accent={r.color}>
        <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7 }}>{inc.analysis?.threat_assessment}</p>
      </Section>

      {/* Action */}
      <Section label="RECOMMENDED ACTION">
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderLeft: `3px solid #c8860a`, borderRadius: 4, padding: "12px 16px" }}>
          <p style={{ fontSize: 13, color: "#c8a060", lineHeight: 1.7 }}>{inc.analysis?.recommended_action}</p>
        </div>
      </Section>

      {/* Risk factors */}
      <Section label="RISK FACTORS">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {inc.risk?.factors?.map((f, i) => (
            <span key={i} style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 3,
              background: "#1e1e1e", border: "1px solid #2a2a2a",
              color: "#666", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em"
            }}>{f.replace(/_/g, " ")}</span>
          ))}
        </div>
      </Section>

      {/* Event timeline */}
      <Section label="EVENT TIMELINE">
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {inc.events?.map((e, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "10px 14px", background: i % 2 === 0 ? "#161616" : "#131313",
              borderRadius: 3
            }}>
              <div style={{ width: 2, height: 28, background: r.color, borderRadius: 1, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#ccc", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                  {EVT_LABEL[e.type] || e.type}
                </div>
                <div style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                  Zone {e.zone} · severity {e.severity_seed}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace" }}>
                {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace" }}>AI CONFIDENCE</span>
        <span style={{ fontSize: 11, color: "#c8860a", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
          {inc.analysis?.confidence?.toUpperCase() || "—"}
        </span>
      </div>
    </div>
  );
}

function Section({ label, children, accent = "#c8860a" }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 12, background: accent, borderRadius: 1 }} />
        <span style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function LiveTicker({ events }) {
  if (events.length === 0) return null;
  const items = [...events, ...events];
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
      <div style={{ display: "inline-flex", gap: 32, animation: "ticker 18s linear infinite" }}>
        {items.map((e, i) => (
          <span key={i} style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>
            <span style={{ color: "#666" }}>{EVT_LABEL[e.type] || e.type}</span>
            <span style={{ color: "#333", margin: "0 6px" }}>·</span>
            <span style={{ color: "#555" }}>{e.zone}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [status, setStatus] = useState("CONNECTING");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${API}/incidents`)
      .then(r => r.json())
      .then(data => { setIncidents(data); setStatus("ONLINE"); })
      .catch(() => setStatus("OFFLINE"));

    const ws = new WebSocket(`${WS_API}/ws/live`);
    ws.onopen = () => setStatus("ONLINE");
    ws.onmessage = e => {
      try {
        const ev = JSON.parse(e.data);
        setLiveEvents(prev => [ev, ...prev].slice(0, 30));
      } catch {}
    };
    ws.onerror = () => setStatus("DEGRADED");
    return () => ws.close();
  }, []);

  const simulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API}/simulate`, { method: "POST" });
      const inc = await res.json();
      setIncidents(prev => [inc, ...prev]);
      setSelected(inc);
    } catch {
      alert("Backend not reachable. Make sure the API service is running.");
    }
    setSimulating(false);
  };

  const high   = incidents.filter(i => i.risk?.level === "HIGH").length;
  const medium = incidents.filter(i => i.risk?.level === "MEDIUM").length;
  const avgScore = incidents.length
    ? Math.round(incidents.reduce((s, i) => s + (i.risk?.score || 0), 0) / incidents.length)
    : 0;
  const statusColor = status === "ONLINE" ? "#2ea87e" : status === "DEGRADED" ? "#d4961a" : "#e8431a";

  return (
    <>
      <style>{FONTS}{css}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#111", minHeight: "100vh", color: "#e0e0e0", display: "flex", flexDirection: "column" }}>

        {/* Top Nav */}
        <header style={{ background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" stroke="#c8860a" strokeWidth={1.5} fill="none" />
                <circle cx={11} cy={11} r={3} fill="#c8860a" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.04em", color: "#f0f0f0" }}>InfraGuard</span>
              <span style={{ fontSize: 15, fontWeight: 300, color: "#c8860a", letterSpacing: "0.04em" }}>AI</span>
            </div>
            <div style={{ width: 1, height: 18, background: "#222" }} />
            <span style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>INCIDENT INTELLIGENCE</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dot color={statusColor} pulse={status === "ONLINE"} />
              <span style={{ fontSize: 11, color: statusColor, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>{status}</span>
            </div>
            <span style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "'DM Mono', monospace" }}>
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button className="sim-btn" onClick={simulate} disabled={simulating}>
              {simulating ? "Analysing…" : "Run Simulation"}
            </button>
          </div>
        </header>

        {/* Stats row */}
        <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "16px 28px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, flexShrink: 0 }}>
          <StatCard label="TOTAL INCIDENTS" value={incidents.length} sub="recorded" />
          <StatCard label="HIGH RISK" value={high} sub="immediate action" accent="#f87a5a" />
          <StatCard label="MEDIUM RISK" value={medium} sub="under watch" accent="#f5bc4a" />
          <StatCard label="AVG RISK SCORE" value={avgScore} sub="out of 100" accent="#c8860a" />
          <StatCard label="LIVE EVENTS" value={liveEvents.length} sub="streamed" accent="#4dcfa4" />
        </div>

        {/* Main 3-col layout */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr 380px", overflow: "hidden" }}>

          {/* Col 1: Incident list */}
          <div style={{ borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>INCIDENTS</span>
              <span style={{ fontSize: 11, color: "#c8860a", fontFamily: "'DM Mono', monospace" }}>{incidents.length}</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {incidents.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#2a2a2a", lineHeight: 1.8 }}>No incidents recorded.<br />Run a simulation to begin.</p>
                </div>
              )}
              {incidents.map(inc => (
                <IncidentRow key={inc.id} inc={inc} selected={selected?.id === inc.id} onClick={() => setSelected(inc)} />
              ))}
            </div>
          </div>

          {/* Col 2: Live feed + zone summary */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#111" }}>

            {/* Zone grid */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: 14 }}>ZONE ACTIVITY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["Alpha", "Bravo", "Charlie", "Perimeter-North", "Gate-7", "Sector-4"].map(zone => {
                  const zoneIncs = incidents.filter(i => i.events?.some(e => e.zone === zone));
                  const topLevel = zoneIncs.find(i => i.risk?.level === "HIGH") ? "HIGH"
                    : zoneIncs.find(i => i.risk?.level === "MEDIUM") ? "MEDIUM"
                    : zoneIncs.length ? "LOW" : null;
                  const r = topLevel ? RISK[topLevel] : null;
                  return (
                    <div key={zone} style={{
                      padding: "10px 14px", borderRadius: 4,
                      background: r ? r.dim : "#161616",
                      border: `1px solid ${r ? r.color + "33" : "#1e1e1e"}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <span style={{ fontSize: 12, color: r ? r.label : "#333", fontWeight: 500 }}>{zone}</span>
                      {topLevel
                        ? <RiskPill level={topLevel} />
                        : <span style={{ fontSize: 10, color: "#2a2a2a", fontFamily: "'DM Mono', monospace" }}>CLEAR</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live event stream */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Dot color="#2ea87e" pulse />
                LIVE EVENT STREAM
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {liveEvents.length === 0 && (
                  <p style={{ fontSize: 12, color: "#2a2a2a" }}>Waiting for events…</p>
                )}
                {liveEvents.map((e, i) => (
                  <div key={i} className={i === 0 ? "fade-in" : ""} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "9px 14px", background: i === 0 ? "#191510" : "transparent",
                    borderRadius: 3, borderLeft: i === 0 ? "2px solid #c8860a44" : "2px solid transparent"
                  }}>
                    <span style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "'DM Mono', monospace", width: 60, flexShrink: 0 }}>
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span style={{ fontSize: 12, color: "#888", fontWeight: 500, flex: 1 }}>{EVT_LABEL[e.type] || e.type}</span>
                    <span style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>→</span>
                    <span style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>{e.zone}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 2,
                      background: e.severity === "high" ? "#e8431a22" : e.severity === "medium" ? "#d4961a22" : "#1a1a1a",
                      color: e.severity === "high" ? "#f87a5a" : e.severity === "medium" ? "#f5bc4a" : "#333",
                      fontFamily: "'DM Mono', monospace"
                    }}>{(e.severity || "low").toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3: Analysis */}
          <div style={{ borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>AI ANALYSIS</span>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AnalysisDetail inc={selected} />
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a", height: 32, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, overflow: "hidden", flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "#c8860a", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", flexShrink: 0 }}>LIVE</span>
          <div style={{ width: 1, height: 12, background: "#222", flexShrink: 0 }} />
          <LiveTicker events={liveEvents} />
        </div>

      </div>
    </>
  );
}
