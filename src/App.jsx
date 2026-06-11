import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { dashboardData } from './data.js';
import { Users, Signal, Activity, Cpu, Zap, Shield, MapPin, Navigation } from 'lucide-react';

const C = {
  green: '#00FF88',
  blue: '#38BFFF',
  orange: '#FF7A35',
  purple: '#A78BFA',
  yellow: '#F5D060',
  red: '#FF4D6A',
  teal: '#2AFCE0',
};

const PIE_COLORS_MAC  = [C.green, C.orange];
const PIE_COLORS_SSID = [C.blue, C.purple];
const RESULT_COLORS   = [C.green, C.blue, C.orange];
const ZONE_COLORS     = [C.green, C.blue, C.purple, C.red];

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0D1628', border:'1px solid #1E3050', borderRadius:8, padding:'8px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>
      <p style={{ color:'#6B8BAE', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.color || C.green }}>
          {p.name}: <strong>{typeof p.value === 'number' ? (p.value % 1 === 0 ? p.value : p.value.toFixed(1)) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, delay=0 }) => (
  <div className="fade-in" style={{ animationDelay:`${delay}ms`, background:'#0D1628', border:'1px solid #1E3050', borderRadius:12, padding:'18px 20px', display:'flex', flexDirection:'column', gap:6, position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}, transparent)`, opacity:0.8 }} />
    <div style={{ display:'flex', alignItems:'center', gap:8, color:'#6B8BAE' }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:28, fontWeight:600, color, lineHeight:1, letterSpacing:'-0.02em' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#6B8BAE', fontFamily:'IBM Plex Mono,monospace' }}>{sub}</div>}
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title, badge }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
    <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6B8BAE' }}>{title}</span>
    {badge && <span style={{ background:'#1E3050', color:C.blue, fontFamily:'IBM Plex Mono,monospace', fontSize:10, padding:'2px 8px', borderRadius:99, letterSpacing:'0.05em' }}>{badge}</span>}
    <div style={{ flex:1, height:1, background:'#1E3050' }} />
  </div>
);

// ── Signal Bar Row ─────────────────────────────────────────────────────────────
const SignalRow = ({ name, count, max, color }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 0' }}>
    <div style={{ width:80, fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#6B8BAE', textAlign:'right', flexShrink:0 }}>{name} dBm</div>
    <div style={{ flex:1, background:'#1E3050', borderRadius:3, height:9, overflow:'hidden' }}>
      <div style={{ width:`${(count/max)*100}%`, height:'100%', background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:3 }} />
    </div>
    <div style={{ width:36, fontFamily:'IBM Plex Mono,monospace', fontSize:11, color, textAlign:'right', flexShrink:0 }}>{count}</div>
  </div>
);

// ── Pie Label ─────────────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  const R = Math.PI / 180;
  const r = outerRadius + 24;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#6B8BAE" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
      style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>
      {name} {(percent*100).toFixed(0)}%
    </text>
  );
};

// ── Scan line ─────────────────────────────────────────────────────────────────
const ScanOverlay = ({ active }) => !active ? null : (
  <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:100, overflow:'hidden' }}>
    <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, #00FF8860, transparent)', animation:'scanLine 2s linear' }} />
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { summary, timeline, manufacturers, mac_types, signal_histogram, ssid_types, result_classification, zone_distribution, distance_histogram } = dashboardData;
  const [scanning, setScanning] = useState(false);

  useEffect(() => { setScanning(true); setTimeout(() => setScanning(false), 2200); }, []);

  const sigMax = Math.max(...signal_histogram.map(b => b.count));

  const stats = [
    { icon: Activity,   label: 'Total Captures',  value: summary.total_records.toLocaleString(),   sub: `${summary.start_time} → ${summary.end_time}`, color: C.green,  delay: 0   },
    { icon: Users,      label: 'Peak Persons',     value: summary.max_people,                       sub: 'estimated at peak',                           color: C.orange, delay: 60  },
    { icon: Cpu,        label: 'Unique Devices',   value: summary.unique_devices.toLocaleString(),  sub: `${summary.unique_profiles} profiles`,         color: C.blue,   delay: 120 },
    { icon: Signal,     label: 'Avg Signal',       value: `${summary.avg_signal_dbm}`,              sub: 'dBm mean RSSI',                               color: C.purple, delay: 180 },
    { icon: Shield,     label: 'Randomized',       value: `${Math.round(summary.random_mac/(summary.random_mac+summary.fixed_mac)*100)}%`, sub: `${summary.random_mac.toLocaleString()} random MACs`, color: C.yellow, delay: 240 },
    { icon: Zap,        label: 'Session',          value: `${summary.duration_min}m`,               sub: `${summary.duration_min}m ${summary.duration_sec}s captured`, color: C.teal, delay: 300 },
    { icon: Navigation, label: 'Avg Distance',     value: `${summary.avg_distance_m}m`,             sub: 'mean probe distance',                         color: C.green,  delay: 360 },
    { icon: MapPin,     label: 'Near Zone',        value: `${zone_distribution[1]?.value.toLocaleString()}`, sub: '"near" zone probes', color: C.blue, delay: 420 },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-deep)', position:'relative' }}>
      <ScanOverlay active={scanning} />

      {/* bg grid */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px 60px', position:'relative', zIndex:1 }}>

        {/* ── HEADER ── */}
        <div className="fade-in" style={{ borderBottom:'1px solid #1E3050', padding:'28px 0 22px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}`, animation:'pulse 2s infinite' }} />
              <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, letterSpacing:'0.15em', color:C.green, textTransform:'uppercase' }}>Wi-Fi Probe Capture</span>
            </div>
            <h1 style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:'clamp(20px,3vw,30px)', fontWeight:600, color:'#E8F4FF', letterSpacing:'-0.02em', lineHeight:1.1 }}>
              Passive Scan Dashboard
            </h1>
            <p style={{ fontSize:13, color:'#6B8BAE', marginTop:6, fontFamily:'IBM Plex Mono,monospace' }}>
              ws_capture_20260416_033307 · Osaka Institute of Technology
            </p>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>
            {[
              { label:'INTERFACE', val:'wlan1 (monitor)' },
              { label:'PROTOCOL',  val:'802.11 probe-req' },
              { label:'ENGINE',    val:'Scapy + RPi5' },
            ].map(({ label, val }) => (
              <div key={label} style={{ background:'#0D1628', border:'1px solid #1E3050', borderRadius:8, padding:'8px 14px' }}>
                <div style={{ color:'#6B8BAE', fontSize:10, marginBottom:2, letterSpacing:'0.08em' }}>{label}</div>
                <div style={{ color:C.blue }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, margin:'28px 0' }}>
          {stats.map((s,i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── TIMELINE ── */}
        <div className="fade-in" style={{ animationDelay:'200ms', background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px 16px', marginBottom:20 }}>
          <SectionHeader title="Estimated Persons — Over Time" badge={`${timeline.length} samples · ${summary.duration_min}m session`} />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline} margin={{ top:4, right:16, left:-20, bottom:0 }}>
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
              <XAxis dataKey="time" tick={{ fill:'#6B8BAE', fontSize:10, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={{ stroke:'#1E3050' }} interval={Math.floor(timeline.length/8)} />
              <YAxis tick={{ fill:'#6B8BAE', fontSize:10, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={summary.max_people} stroke={C.orange} strokeDasharray="4 4" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke={C.blue}  strokeWidth={1.5} fill="url(#gConfirmed)" dot={false} />
              <Area type="monotone" dataKey="people"    name="Estimated" stroke={C.green} strokeWidth={2}   fill="url(#gPeople)"    dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:20, marginTop:10, fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#6B8BAE' }}>
            {[
              { color:C.green,  label:'Estimated persons' },
              { color:C.blue,   label:'Confirmed count' },
              { color:C.orange, label:`Peak (${summary.max_people})` },
            ].map(({ color, label }) => (
              <span key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:20, height:2, background:color, display:'inline-block', borderRadius:1 }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── ROW 2: Manufacturers + Signal ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          <div className="fade-in" style={{ animationDelay:'280ms', background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px' }}>
            <SectionHeader title="Top Device Manufacturers" badge={`${manufacturers.length} vendors`} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={manufacturers} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.blue}  stopOpacity={0.7} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="#1E3050" horizontal={false} />
                <XAxis type="number" tick={{ fill:'#6B8BAE', fontSize:10, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={{ stroke:'#1E3050' }} />
                <YAxis type="category" dataKey="name" tick={{ fill:'#E8F4FF', fontSize:11, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Devices" fill="url(#gBar)" radius={[0,4,4,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fade-in" style={{ animationDelay:'340ms', background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px' }}>
            <SectionHeader title="Signal Strength Distribution" badge="RSSI dBm" />
            <div style={{ paddingTop:8 }}>
              {signal_histogram.map((bin, i) => {
                const v = parseInt(bin.range);
                const color = v > -35 ? C.green : v > -50 ? C.blue : v > -65 ? C.purple : C.red;
                return <SignalRow key={i} name={bin.range} count={bin.count} max={sigMax} color={color} />;
              })}
            </div>
            <div style={{ marginTop:14, fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:'#6B8BAE', display:'flex', gap:16, flexWrap:'wrap' }}>
              <span><span style={{ color:C.green }}>■</span> Strong (&gt;-35)</span>
              <span><span style={{ color:C.blue }}>■</span> Good (-35→-50)</span>
              <span><span style={{ color:C.purple }}>■</span> Weak (-50→-65)</span>
              <span><span style={{ color:C.red }}>■</span> Poor (&lt;-65)</span>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Zone + Distance ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          {/* Zone donut */}
          <div className="fade-in" style={{ animationDelay:'400ms', background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px' }}>
            <SectionHeader title="Probe Zone Distribution" badge="RSSI-derived" />
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={zone_distribution} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false}>
                    {zone_distribution.map((_, i) => <Cell key={i} fill={ZONE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                {zone_distribution.map((z, i) => (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'IBM Plex Mono,monospace', fontSize:11, marginBottom:4 }}>
                      <span style={{ color: ZONE_COLORS[i] }}>{z.name}</span>
                      <span style={{ color:'#E8F4FF' }}>{z.value.toLocaleString()}</span>
                    </div>
                    <div style={{ background:'#1E3050', borderRadius:3, height:6 }}>
                      <div style={{ width:`${(z.value/zone_distribution.reduce((a,b)=>a+b.value,0))*100}%`, height:'100%', background:ZONE_COLORS[i], borderRadius:3, opacity:0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distance histogram */}
          <div className="fade-in" style={{ animationDelay:'460ms', background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px' }}>
            <SectionHeader title="Estimated Distance Distribution" badge="meters" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distance_histogram} margin={{ top:4, right:16, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="gDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.teal} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="#1E3050" vertical={false} />
                <XAxis dataKey="range" tick={{ fill:'#6B8BAE', fontSize:9, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={{ stroke:'#1E3050' }} />
                <YAxis tick={{ fill:'#6B8BAE', fontSize:10, fontFamily:'IBM Plex Mono,monospace' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Probes" fill="url(#gDist)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ROW 4: MAC + SSID + Result ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>
          {[
            { title:'MAC Address Type',    data:mac_types,             colors:PIE_COLORS_MAC,  delay:520 },
            { title:'Probe Request Type',  data:ssid_types,            colors:PIE_COLORS_SSID, delay:580 },
            { title:'Detection Result',    data:result_classification, colors:RESULT_COLORS,   delay:640 },
          ].map(({ title, data, colors, delay }) => (
            <div key={title} className="fade-in" style={{ animationDelay:`${delay}ms`, background:'#0D1628', border:'1px solid #1E3050', borderRadius:14, padding:'20px 24px' }}>
              <SectionHeader title={title} />
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                    {data.map((_,i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'center', gap:12, fontFamily:'IBM Plex Mono,monospace', fontSize:11, flexWrap:'wrap' }}>
                {data.map((d,i) => (
                  <span key={i} style={{ color:'#6B8BAE' }}>
                    <span style={{ color:colors[i % colors.length] }}>■</span> {d.name}
                    <span style={{ color:colors[i % colors.length], marginLeft:4 }}>{d.value.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop:'1px solid #1E3050', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#6B8BAE', flexWrap:'wrap', gap:8 }}>
          <span>Capture session · {summary.start_time} – {summary.end_time} JST · {summary.total_records.toLocaleString()} frames · OIT Research 2026</span>
          <span style={{ color:'#1E3050' }}>Built with Scapy + RPi5 · Visualized with Recharts</span>
        </div>
      </div>
    </div>
  );
}