import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { dashboardData } from './data.js';
import { Wifi, Users, Radio, Signal, Activity, Cpu, Zap, Shield } from 'lucide-react';

// ── Color system ──────────────────────────────────────────────────────────────
const C = {
  green: '#00FF88',
  blue: '#38BFFF',
  orange: '#FF7A35',
  purple: '#A78BFA',
  yellow: '#F5D060',
  red: '#FF4D6A',
  teal: '#2AFCE0',
};

const PIE_COLORS_MAC = [C.green, C.orange];
const PIE_COLORS_SSID = [C.blue, C.purple];
const RESULT_COLORS = [C.green, C.blue, C.orange];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#0D1628',
      border: '1px solid #1E3050',
      borderRadius: 8,
      padding: '8px 14px',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 12,
    }}>
      <p style={{ color: '#6B8BAE', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#00FF88' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 1) : p.value}</strong>{unit}
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <div className="fade-in" style={{
    animationDelay: `${delay}ms`,
    background: '#0D1628',
    border: `1px solid #1E3050`,
    borderRadius: 12,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      opacity: 0.8,
    }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B8BAE' }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 28,
      fontWeight: 600,
      color,
      lineHeight: 1,
      letterSpacing: '-0.02em',
    }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#6B8BAE', fontFamily: 'IBM Plex Mono, monospace' }}>{sub}</div>}
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
    <span style={{
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#6B8BAE',
    }}>{title}</span>
    {badge && (
      <span style={{
        background: '#1E3050',
        color: '#38BFFF',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 99,
        letterSpacing: '0.05em',
      }}>{badge}</span>
    )}
    <div style={{ flex: 1, height: 1, background: '#1E3050' }} />
  </div>
);

// ── Signal Bar Row ─────────────────────────────────────────────────────────────
const SignalRow = ({ name, count, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
    <div style={{ width: 80, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#6B8BAE', textAlign: 'right', flexShrink: 0 }}>
      {name} dBm
    </div>
    <div style={{ flex: 1, background: '#1E3050', borderRadius: 3, height: 10, overflow: 'hidden' }}>
      <div style={{
        width: `${(count / max) * 100}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 3,
        transition: 'width 0.8s ease',
      }} />
    </div>
    <div style={{ width: 32, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color, textAlign: 'right', flexShrink: 0 }}>
      {count}
    </div>
  </div>
);

// ── Custom Pie Label ──────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 24;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#6B8BAE" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
      style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ── Scan Animation ─────────────────────────────────────────────────────────────
const ScanOverlay = ({ active }) => {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #00FF8860, transparent)',
        animation: 'scanLine 2s linear',
      }} />
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { summary, timeline, manufacturers, mac_types, signal_histogram, ssid_types, result_classification } = dashboardData;
  const [scanning, setScanning] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setLoaded(true); }, 2200);
  }, []);

  // Compute signal color gradient per bin
  const sigMax = Math.max(...signal_histogram.map(b => b.count));
  const sigColor = (val) => {
    const ratio = val / sigMax;
    if (ratio > 0.7) return C.green;
    if (ratio > 0.4) return C.blue;
    return C.purple;
  };

  // Duration
  const t0 = summary.start_time;
  const t1 = summary.end_time;
  const toSec = t => { const [h,m,s]=t.split(':').map(Number); return h*3600+m*60+s; };
  const durMin = Math.floor((toSec(t1)-toSec(t0))/60);
  const durSec = (toSec(t1)-toSec(t0))%60;

  const stats = [
    { icon: Activity, label: 'Total Captures', value: summary.total_records.toLocaleString(), sub: `${t0} → ${t1}`, color: C.green, delay: 0 },
    { icon: Users, label: 'Peak Persons', value: summary.max_people, sub: 'estimated at peak', color: C.orange, delay: 80 },
    { icon: Cpu, label: 'Unique Devices', value: summary.unique_devices, sub: `${summary.unique_profiles} profiles`, color: C.blue, delay: 160 },
    { icon: Signal, label: 'Avg Signal', value: `${summary.avg_signal_dbm}`, sub: 'dBm mean RSSI', color: C.purple, delay: 240 },
    { icon: Shield, label: 'Randomized', value: `${Math.round(summary.random_mac / (summary.random_mac + summary.fixed_mac) * 100)}%`, sub: `${summary.random_mac} random MACs`, color: C.yellow, delay: 320 },
    { icon: Zap, label: 'Session', value: `${durMin}m`, sub: `${durMin}min ${durSec}s captured`, color: C.teal, delay: 400 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: 0, position: 'relative' }}>
      <ScanOverlay active={scanning} />

      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div className="fade-in" style={{
          borderBottom: '1px solid #1E3050',
          padding: '28px 0 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                letterSpacing: '0.15em',
                color: C.green,
                textTransform: 'uppercase',
              }}>Wi-Fi Probe Capture</span>
            </div>
            <h1 style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 'clamp(20px, 3vw, 30px)',
              fontWeight: 600,
              color: '#E8F4FF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Passive Scan Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#6B8BAE', marginTop: 6, fontFamily: 'IBM Plex Mono, monospace' }}>
              ws_capture_20260609_152254 · Osaka Institute of Technology
            </p>
          </div>
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          }}>
            {[
              { label: 'INTERFACE', val: 'wlan1 (monitor)' },
              { label: 'PROTOCOL', val: '802.11 probe-req' },
              { label: 'ENGINE', val: 'Scapy + RPi5' },
            ].map(({ label, val }) => (
              <div key={label} style={{
                background: '#0D1628',
                border: '1px solid #1E3050',
                borderRadius: 8,
                padding: '8px 14px',
              }}>
                <div style={{ color: '#6B8BAE', fontSize: 10, marginBottom: 2, letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ color: C.blue }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
          margin: '28px 0',
        }}>
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── TIMELINE ── */}
        <div className="fade-in" style={{
          animationDelay: '200ms',
          background: '#0D1628',
          border: '1px solid #1E3050',
          borderRadius: 14,
          padding: '20px 24px 16px',
          marginBottom: 20,
        }}>
          <SectionHeader title="Estimated Persons — Over Time" badge={`${timeline.length} samples`} />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gConfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="#1E3050" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#6B8BAE', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
                tickLine={false} axisLine={{ stroke: '#1E3050' }}
                interval={Math.floor(timeline.length / 8)}
              />
              <YAxis tick={{ fill: '#6B8BAE', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
                tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={summary.max_people} stroke={C.orange} strokeDasharray="4 4" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke={C.blue} strokeWidth={1.5}
                fill="url(#gConfirmed)" dot={false} />
              <Area type="monotone" dataKey="people" name="Estimated" stroke={C.green} strokeWidth={2}
                fill="url(#gPeople)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#6B8BAE' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 2, background: C.green, display: 'inline-block', borderRadius: 1 }} />
              Estimated persons
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 2, background: C.blue, display: 'inline-block', borderRadius: 1 }} />
              Confirmed count
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 2, background: C.orange, strokeDasharray: '4 4', display: 'inline-block', borderRadius: 1 }} />
              Peak ({summary.max_people})
            </span>
          </div>
        </div>

        {/* ── ROW 2: Manufacturers + Signal Distribution ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Manufacturers */}
          <div className="fade-in" style={{
            animationDelay: '300ms',
            background: '#0D1628',
            border: '1px solid #1E3050',
            borderRadius: 14,
            padding: '20px 24px',
          }}>
            <SectionHeader title="Top Device Manufacturers" badge={`${manufacturers.length} vendors`} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={manufacturers} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.blue} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="#1E3050" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B8BAE', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
                  tickLine={false} axisLine={{ stroke: '#1E3050' }} />
                <YAxis type="category" dataKey="name"
                  tick={{ fill: '#E8F4FF', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                  tickLine={false} axisLine={false} width={78} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Devices" fill="url(#gBar)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Signal Distribution */}
          <div className="fade-in" style={{
            animationDelay: '380ms',
            background: '#0D1628',
            border: '1px solid #1E3050',
            borderRadius: 14,
            padding: '20px 24px',
          }}>
            <SectionHeader title="Signal Strength Distribution" badge="RSSI dBm" />
            <div style={{ paddingTop: 8 }}>
              {signal_histogram.map((bin, i) => {
                const color = parseInt(bin.range) > -30 ? C.green :
                              parseInt(bin.range) > -50 ? C.blue :
                              parseInt(bin.range) > -65 ? C.purple : C.red;
                return <SignalRow key={i} name={bin.range} count={bin.count} max={sigMax} color={color} />;
              })}
            </div>
            <div style={{ marginTop: 14, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#6B8BAE', display: 'flex', gap: 16 }}>
              <span style={{ color: C.green }}>■</span> Strong (&gt; -30)
              <span style={{ color: C.blue }}>■</span> Good (−30→−50)
              <span style={{ color: C.purple }}>■</span> Weak (−50→−65)
              <span style={{ color: C.red }}>■</span> Poor (&lt; −65)
            </div>
          </div>
        </div>

        {/* ── ROW 3: MAC Type + SSID Type + Result Classification ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* MAC Type */}
          <div className="fade-in" style={{
            animationDelay: '460ms',
            background: '#0D1628',
            border: '1px solid #1E3050',
            borderRadius: 14,
            padding: '20px 24px',
          }}>
            <SectionHeader title="MAC Address Type" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={mac_types} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                  {mac_types.map((_, i) => <Cell key={i} fill={PIE_COLORS_MAC[i % 2]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
              {mac_types.map((d, i) => (
                <span key={i} style={{ color: '#6B8BAE' }}>
                  <span style={{ color: PIE_COLORS_MAC[i] }}>■</span> {d.name}
                  <span style={{ color: PIE_COLORS_MAC[i], marginLeft: 4 }}>{d.value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* SSID Type */}
          <div className="fade-in" style={{
            animationDelay: '520ms',
            background: '#0D1628',
            border: '1px solid #1E3050',
            borderRadius: 14,
            padding: '20px 24px',
          }}>
            <SectionHeader title="Probe Request Type" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={ssid_types} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                  {ssid_types.map((_, i) => <Cell key={i} fill={PIE_COLORS_SSID[i % 2]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
              {ssid_types.map((d, i) => (
                <span key={i} style={{ color: '#6B8BAE' }}>
                  <span style={{ color: PIE_COLORS_SSID[i] }}>■</span> {d.name}
                  <span style={{ color: PIE_COLORS_SSID[i], marginLeft: 4 }}>{d.value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Result Classification */}
          <div className="fade-in" style={{
            animationDelay: '580ms',
            background: '#0D1628',
            border: '1px solid #1E3050',
            borderRadius: 14,
            padding: '20px 24px',
          }}>
            <SectionHeader title="Detection Result" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={result_classification} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                  {result_classification.map((_, i) => <Cell key={i} fill={RESULT_COLORS[i % 3]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, flexWrap: 'wrap' }}>
              {result_classification.map((d, i) => (
                <span key={i} style={{ color: '#6B8BAE' }}>
                  <span style={{ color: RESULT_COLORS[i] }}>■</span> {d.name}
                  <span style={{ color: RESULT_COLORS[i], marginLeft: 4 }}>{d.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          borderTop: '1px solid #1E3050',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11,
          color: '#6B8BAE',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span>
            Capture session · {summary.start_time} – {summary.end_time} JST · {summary.total_records.toLocaleString()} frames · OIT Research 2026
          </span>
          <span style={{ color: '#1E3050' }}>
            Built with Scapy + RPi5 · Visualized with Recharts
          </span>
        </div>
      </div>
    </div>
  );
}
