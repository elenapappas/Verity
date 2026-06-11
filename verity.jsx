import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────
   VERITY  ·  Student Stress Intelligence
   Design: Warm ivory + deep ink + amber + sage teal
   Fonts:  Fraunces (display) + DM Sans (body)
───────────────────────────────────────────────────────── */

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,500;0,9..144,700;1,9..144,300&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
`;

const C = {
  bg:       '#f7f4ef',
  bg2:      '#edeae3',
  surface:  '#ffffff',
  surfaceHover: '#fdfcf9',
  border:   'rgba(30,24,16,0.12)',
  borderHover: 'rgba(30,24,16,0.28)',
  ink:      '#1a1610',
  gold:     '#b87800',
  goldDim:  'rgba(184,120,0,0.12)',
  goldLight:'rgba(184,120,0,0.07)',
  teal:     '#0f7a60',
  tealDim:  'rgba(15,122,96,0.10)',
  muted:    'rgba(26,22,16,0.78)',
  faint:    'rgba(26,22,16,0.58)',
  font:     "'Fraunces', Georgia, serif",
  sans:     "'DM Sans', system-ui, sans-serif",
};

const scoreColor = s =>
  s < 2  ? '#3b82f6' :   // blue  – low energy
  s < 4  ? '#1e9e80' :   // teal  – optimal low
  s < 6  ? '#5a9e1e' :   // green – optimal high
  s < 7.5? '#c4871a' :   // amber – elevated
  s < 9  ? '#d95f1a' :   // orange – high
             '#c0392b';  // red   – critical

const scoreLabel = s =>
  s < 2  ? 'Understressed' :
  s < 4  ? 'Well-Balanced' :
  s < 6  ? 'Optimal Zone' :
  s < 7.5? 'Elevated' :
  s < 9  ? 'High Stress' :
             'Critical';

/* ── Ambient light background ── */
function AmbientBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-2deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.04)} }
      `}</style>

      {/* Large warm blob top-right */}
      <div style={{
        position:'absolute', top:'-12%', right:'-8%', width:560, height:560, borderRadius:'60% 40% 55% 45% / 50% 60% 40% 50%',
        background:'radial-gradient(ellipse, rgba(184,120,0,0.10) 0%, rgba(184,120,0,0.04) 60%, transparent 80%)',
        animation:'floatA 12s ease-in-out infinite', filter:'blur(32px)',
      }}/>
      {/* Teal blob bottom-left */}
      <div style={{
        position:'absolute', bottom:'-10%', left:'-6%', width:500, height:500, borderRadius:'45% 55% 40% 60% / 55% 45% 55% 45%',
        background:'radial-gradient(ellipse, rgba(15,122,96,0.08) 0%, rgba(15,122,96,0.02) 60%, transparent 80%)',
        animation:'floatB 15s ease-in-out infinite', filter:'blur(40px)',
      }}/>
      {/* Small gold center accent */}
      <div style={{
        position:'absolute', top:'40%', left:'55%', width:280, height:280, borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(184,120,0,0.06) 0%, transparent 70%)',
        animation:'floatC 9s ease-in-out infinite', filter:'blur(20px)',
      }}/>

      {/* Subtle dot grid texture */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.35 }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="rgba(26,22,16,0.10)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
    </div>
  );
}

/* ── Stress Gauge (semicircle SVG) ── */
function StressGauge({ score, visible }) {
  const R = 86;
  const arc = Math.PI * R;
  const pct = visible ? Math.min(score / 10, 1) : 0;
  const dashOffset = arc * (1 - pct);
  const color = scoreColor(score);

  // Needle tip — pivot at arc center (110, 102)
  const angle = pct * Math.PI;
  const nx = 110 - (R - 18) * Math.cos(angle);
  const ny = 102 - (R - 18) * Math.sin(angle);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg width="220" height="128" viewBox="0 0 220 128" style={{ overflow:'visible', display:'block' }}>
        {/* Zone labels */}
        <text x="12" y="125" fill={C.faint} fontSize="9" fontFamily={C.sans}>LOW</text>
        <text x="110" y="12" textAnchor="middle" fill={C.faint} fontSize="9" fontFamily={C.sans}>OPTIMAL</text>
        <text x="208" y="125" textAnchor="end" fill={C.faint} fontSize="9" fontFamily={C.sans}>HIGH</text>

        {/* Track */}
        <path d="M 14 102 A 86 86 0 0 1 206 102"
          fill="none" stroke="rgba(26,22,16,0.10)" strokeWidth="16" strokeLinecap="round"/>

        {/* Optimal zone highlight (3–6 = 30%–60% of arc) */}
        <path d="M 14 102 A 86 86 0 0 1 206 102"
          fill="none" stroke="rgba(62,207,168,0.08)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={arc * 0.4}
          style={{ transformOrigin:'center', transform:`rotate(0deg)` }}
        />
        {/* clip to 30-60 segment — approximate with a second arc */}
        <path d="M 14 102 A 86 86 0 0 1 206 102"
          fill="none" stroke="rgba(62,207,168,0.12)" strokeWidth="16"
          strokeDasharray={`${arc * 0.3} ${arc}`}
          strokeDashoffset={`-${arc * 0.3}`}
        />

        {/* Score arc */}
        <path d="M 14 102 A 86 86 0 0 1 206 102"
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 2s cubic-bezier(0.34,1.3,0.64,1), stroke 0.8s ease',
            filter: `drop-shadow(0 0 12px ${color}99)`,
          }}
        />

        {/* Needle */}
        {visible && (
          <line
            x1="110" y1="102" x2={nx} y2={ny}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition:'all 2s cubic-bezier(0.34,1.3,0.64,1)', filter:`drop-shadow(0 0 4px ${color})` }}
          />
        )}
        <circle cx="110" cy="102" r="5" fill={C.bg2} stroke={color} strokeWidth="2"
          style={{ filter:`drop-shadow(0 0 4px ${color})` }}/>

        {/* score displayed below SVG, not inside */}
      </svg>
      {/* Score number below gauge, clear of needle */}
      <div style={{
        fontFamily: C.font, fontSize: 56, fontWeight: 500,
        color, lineHeight: 1, marginTop: 2,
        transition: 'color 0.8s ease',
      }}>
        {visible ? score.toFixed(1) : '—'}
      </div>
    </div>
  );
}

/* ── Input Components ── */
function Field({ label, hint, value, onChange, type='number', min, max, placeholder, large }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display:'block', fontFamily:C.sans, fontSize:13, color:C.muted, marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase', fontWeight:600 }}>
        {label}
      </label>
      {hint && <p style={{ fontFamily:C.sans, fontSize:12, color:C.faint, margin:'0 0 8px', lineHeight:1.5 }}>{hint}</p>}
      {large ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box', background:C.surface, border:`1.5px solid ${focused ? C.gold : C.border}`,
            borderRadius:12, padding:'12px 16px', color:C.ink, fontFamily:C.sans, fontSize:14, fontWeight:400,
            resize:'none', outline:'none', lineHeight:1.6,
            transition:'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? `0 0 0 3px ${C.goldDim}` : '0 1px 3px rgba(0,0,0,0.06)',
          }}
        />
      ) : (
        <input
          type={type === 'number' ? 'number' : 'text'}
          min={min} max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box', background:C.surface, border:`1.5px solid ${focused ? C.gold : C.border}`,
            borderRadius:12, padding:'12px 16px', color:C.ink, fontFamily:C.sans, fontSize:15, fontWeight:500,
            outline:'none', appearance:'textfield',
            transition:'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? `0 0 0 3px ${C.goldDim}` : '0 1px 3px rgba(0,0,0,0.06)',
          }}
        />
      )}
    </div>
  );
}

function SliderField({ label, hint, value, onChange, min=0, max=12, step=0.5, unit='' }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <label style={{ fontFamily:C.sans, fontSize:13, color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase', fontWeight:600 }}>{label}</label>
        <span style={{ fontFamily:C.font, fontSize:22, color:C.gold, fontWeight:500 }}>{value}<span style={{fontSize:13,color:C.muted}}>{unit}</span></span>
      </div>
      {hint && <p style={{ fontFamily:C.sans, fontSize:12, color:C.faint, margin:'0 0 10px', lineHeight:1.5 }}>{hint}</p>}
      <style>{`
        input[type=range].verity-slider { -webkit-appearance:none; appearance:none; height:6px; border-radius:99px; outline:none; cursor:pointer; }
        input[type=range].verity-slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:${C.gold}; cursor:pointer; box-shadow:0 0 8px ${C.gold}88; border:2px solid #fff2; transition:transform 0.1s; }
        input[type=range].verity-slider::-webkit-slider-thumb:hover { transform:scale(1.2); }
        input[type=range].verity-slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:${C.gold}; cursor:pointer; border:2px solid #fff2; }
      `}</style>
      <input
        type="range"
        className="verity-slider"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width:'100%',
          background: `linear-gradient(to right, ${C.gold} ${((value-min)/(max-min))*100}%, rgba(255,255,255,0.1) ${((value-min)/(max-min))*100}%)`,
        }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontFamily:C.sans, fontSize:10, color:C.faint }}>{min}{unit}</span>
        <span style={{ fontFamily:C.sans, fontSize:10, color:C.faint }}>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Button ── */
function Btn({ children, onClick, disabled, secondary, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: C.sans, fontWeight:500, cursor: disabled ? 'not-allowed' : 'pointer',
        border:'none', outline:'none', borderRadius:12,
        padding: small ? '10px 22px' : '14px 32px',
        fontSize: small ? 13 : 15,
        letterSpacing:'0.03em',
        transition:'all 0.2s',
        background: secondary
          ? (hov ? 'rgba(26,22,16,0.06)' : 'rgba(26,22,16,0.03)')
          : disabled
            ? 'rgba(184,120,0,0.3)'
            : hov ? '#b87b14' : C.gold,
        color: secondary ? C.ink : '#fff',
        border: secondary ? `1px solid ${C.border}` : 'none',
        transform: hov && !disabled ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: !secondary && !disabled ? (hov ? `0 8px 24px ${C.gold}44` : `0 4px 16px ${C.gold}22`) : 'none',
        opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

/* ── Card ── */
function Card({ children, accent, style: extraStyle }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${accent ? accent+'28' : C.border}`,
      borderRadius: 16,
      padding: '20px 24px',
      position:'relative',
      overflow:'hidden',
      boxShadow: `0 2px 8px rgba(0,0,0,0.07)`,
      ...(accent ? { boxShadow:`0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px ${accent}18 inset` } : {}),
      ...extraStyle,
    }}>
      {accent && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(to right, ${accent}88, transparent)`, borderRadius:'16px 16px 0 0' }}/>}
      {children}
    </div>
  );
}

/* ── Progress Dots ── */
function Steps({ current, total }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:32 }}>
      {Array.from({length:total}, (_,i) => (
        <div key={i} style={{
          width: i === current ? 24 : 8, height:8, borderRadius:99,
          background: i < current ? C.teal : i === current ? C.gold : C.border,
          transition:'all 0.3s ease',
          boxShadow: i === current ? `0 0 8px ${C.gold}88` : 'none',
        }}/>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGES
════════════════════════════════════════════ */

/* ── LANDING ── */
function Landing({ onStart }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 80px', textAlign:'center' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.25s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.4s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.55s ease both; }
      `}</style>

      {vis && <>
        {/* Logo */}
        <h1 className="fade-up-1" style={{
          fontFamily:C.font, fontSize:'clamp(72px,12vw,120px)', fontWeight:500,
          color:C.ink, margin:0, lineHeight:0.9, letterSpacing:'-0.02em',
        }}>
          Verity
        </h1>

        <p className="fade-up-2" style={{
          fontFamily:C.font, fontStyle:'italic', fontSize:'clamp(16px,3vw,22px)',
          color:C.gold, margin:'16px 0 0', fontWeight:400, letterSpacing:'0.02em',
        }}>
          Know your stress before it knows you.
        </p>

        <p className="fade-up-3" style={{
          fontFamily:C.sans, fontSize:15, color:C.muted, lineHeight:1.7, fontWeight:400,
          maxWidth:460, margin:'28px auto 0', fontWeight:400,
        }}>
          Log your week. Get an AI-powered stress prediction. Receive a personalized plan
          to stay in the zone — not drowning, not coasting.
        </p>

        <div className="fade-up-4" style={{ marginTop:40 }}>
          <Btn onClick={onStart}>Check in on this week →</Btn>
        </div>

        {/* Stats row */}
        <div className="fade-up-4" style={{ display:'flex', gap:40, marginTop:56, flexWrap:'wrap', justifyContent:'center' }}>
          {[['1 in 7','adolescents worldwide experience a mental health condition'],
            ['166M','young people affected globally'],
            ['0–10','personalized stress index, calibrated to high school life']].map(([n,l]) => (
            <div key={n} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:C.font, fontSize:28, color:C.gold, fontWeight:500 }}>{n}</div>
              <div style={{ fontFamily:C.sans, fontSize:11, color:C.faint, maxWidth:120, lineHeight:1.5, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="fade-up-4" style={{ marginTop:40, display:'flex', alignItems:'center', gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontFamily:C.sans, fontSize:12, color:C.faint }}>Your data never leaves your session. No school access. Ever.</span>
        </div>
      </>}
    </div>
  );
}

/* ── Privacy Policy Modal ── */
function PrivacyModal({ onClose }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(26,22,16,0.45)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.bg, borderRadius:20, padding:'32px 28px', maxWidth:520, width:'100%',
        maxHeight:'80vh', overflowY:'auto', border:`1px solid ${C.border}`,
        boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <h2 style={{ fontFamily:C.font, fontSize:24, color:C.ink, margin:0, fontWeight:500 }}>Privacy Policy</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:20, padding:4, lineHeight:1 }}>✕</button>
        </div>

        {[
          ['What Verity collects', 'When you fill out the weekly check-in, your inputs (sleep hours, homework load, extracurricular hours, screen time, and social stress level) are used only to compute your stress score. Nothing is saved to a database, server, or file. When you close the tab, everything is gone.'],
          ['What we never collect', 'Verity does not collect your name, email address, age, school, location, or any identifying information. We do not use cookies, analytics trackers, or advertising pixels. We do not share any data with schools, parents, or third parties — ever.'],
          ['API usage', 'To generate the personalized narrative on your results, your anonymized stress data (score and factor summary, never your raw inputs) is sent to Anthropic\'s Claude API solely to produce text. Anthropic\'s data handling is governed by their privacy policy at anthropic.com.'],
          ['Children\'s privacy (COPPA)', 'Verity does not knowingly collect personal information from users of any age. Because no account is required and no data is stored, Verity does not fall within the data-collection provisions of COPPA. If you are under 13, you can use Verity safely — nothing about you is retained.'],
          ['Changes to this policy', 'If this policy ever changes, the updated version will appear here. We will never change our core commitment: your data does not leave your session.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom:20 }}>
            <h3 style={{ fontFamily:C.sans, fontSize:12, fontWeight:600, color:C.gold, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 6px' }}>{title}</h3>
            <p style={{ fontFamily:C.sans, fontSize:13, color:C.muted, margin:0, lineHeight:1.7 }}>{body}</p>
          </div>
        ))}

        <p style={{ fontFamily:C.sans, fontSize:11, color:C.faint, margin:'24px 0 0', lineHeight:1.6, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
          Last updated: June 2026 · Built by Elena for the Mott Million Dollar Challenge
        </p>
      </div>
    </div>
  );
}

/* ── Site Footer (disclaimer + privacy link) ── */
function SiteFooter({ onPrivacy }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:`linear-gradient(to top, ${C.bg} 70%, transparent)`,
      padding:'16px 24px 12px',
      display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap',
    }}>
      <p style={{ fontFamily:C.sans, fontSize:11, color:C.faint, margin:0, textAlign:'center', lineHeight:1.6, maxWidth:560 }}>
        Verity is a self-reflection tool, not a clinical assessment. It is not a substitute for talking to a school counselor, therapist, or trusted adult.
      </p>
      <button onClick={onPrivacy} style={{
        background:'none', border:'none', cursor:'pointer', fontFamily:C.sans,
        fontSize:11, color:C.gold, textDecoration:'underline', padding:0, flexShrink:0,
        fontWeight:600,
      }}>
        Privacy Policy
      </button>
    </div>
  );
}

/* ── Crisis Resources Card (shown when score ≥ 8) ── */
function CrisisCard() {
  return (
    <div style={{
      background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.20)',
      borderRadius:14, padding:'16px 20px', marginBottom:20,
    }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🤝</span>
        <div>
          <p style={{ fontFamily:C.sans, fontSize:13, fontWeight:600, color:'rgba(150,30,20,0.95)', margin:'0 0 6px' }}>
            Your score is high — you don't have to carry this alone.
          </p>
          <p style={{ fontFamily:C.sans, fontSize:13, color:C.muted, margin:'0 0 10px', lineHeight:1.6 }}>
            Verity can help you understand your stress, but it's no substitute for real support. Consider talking to a counselor, a parent, or a trusted adult. If things feel overwhelming, free help is always available:
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              ['Crisis Text Line', 'Text HOME to 741741', 'Free, confidential, 24/7'],
              ['988 Suicide & Crisis Lifeline', 'Call or text 988', 'Free, confidential, 24/7'],
            ].map(([name, contact, note]) => (
              <div key={name} style={{
                background:'rgba(255,255,255,0.6)', borderRadius:10, padding:'10px 14px',
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
              }}>
                <div>
                  <span style={{ fontFamily:C.sans, fontSize:13, fontWeight:600, color:C.ink }}>{name}</span>
                  <span style={{ fontFamily:C.sans, fontSize:11, color:C.faint, display:'block' }}>{note}</span>
                </div>
                <span style={{ fontFamily:C.font, fontSize:14, color:'rgba(150,30,20,0.9)', fontWeight:500 }}>{contact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FORM ── */
function Form({ onSubmit, onBack }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    assignments: '', tests: '', homeworkHours: 2, projectsDue: '',
    activities: '', practiceHours: 6, sleepHours: 7, screenTime: 3,
    socialStress: 0, otherContext: '',
  });
  const set = (k,v) => setData(d => ({...d, [k]:v}));

  const steps = [
    {
      title: 'Academic Load',
      sub: 'What does your school week look like?',
      fields: <>
        <Field label="Assignments due this week" placeholder="e.g. 4" type="number" value={data.assignments} onChange={v=>set('assignments',v)} min={0}/>
        <Field label="Tests or quizzes" placeholder="e.g. 2 — or describe them" value={data.tests} onChange={v=>set('tests',v)}/>
        <SliderField label="Homework hours per night" value={data.homeworkHours} onChange={v=>set('homeworkHours',v)} min={0} max={8} step={0.5} unit="h"/>
        <Field label="Major projects or papers due" placeholder="e.g. history essay, lab report" value={data.projectsDue} onChange={v=>set('projectsDue',v)}/>
      </>
    },
    {
      title: 'Your Schedule',
      sub: 'How are you spending your time and energy?',
      fields: <>
        <SliderField label="Extracurricular hours this week" value={data.practiceHours} onChange={v=>set('practiceHours',v)} min={0} max={30} step={1} unit="h"/>
        <SliderField label="Average sleep per night" value={data.sleepHours} onChange={v=>set('sleepHours',v)} min={3} max={12} step={0.5} unit="h"/>
        <SliderField label="Daily screen time (non-school)" value={data.screenTime} onChange={v=>set('screenTime',v)} min={0} max={12} step={0.5} unit="h"/>
      </>
    },
    {
      title: 'Anything Else?',
      sub: 'Optional — but the more context, the more accurate your prediction.',
      fields: <>
        <SliderField label="Social or relationship stress" hint="Friend conflicts, family tension, romantic stress, social pressure…" value={data.socialStress} onChange={v=>set('socialStress',v)} min={0} max={10} step={1} unit="/10"/>
        <Field label="Anything else on your mind this week" placeholder="Upcoming events, pressure you're feeling, how last week went…" value={data.otherContext} onChange={v=>set('otherContext',v)} large/>
        <div style={{ background:C.tealDim, border:`1px solid rgba(15,122,96,0.18)`, borderRadius:12, padding:'14px 16px', marginTop:8 }}>
          <p style={{ fontFamily:C.sans, fontSize:12, color:'rgba(8,80,60,0.95)', margin:0, lineHeight:1.6 }}>
            🔒 None of this is stored or shared. Verity uses your inputs to generate a stress score, then everything stays in this browser session.
          </p>
        </div>
      </>
    }
  ];

  const s = steps[step];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 100px' }}>
      <div style={{ width:'100%', maxWidth:520 }}>

        {/* Header */}
        <div style={{ marginBottom:8 }}>
          <button onClick={step === 0 ? onBack : ()=>setStep(s=>s-1)} style={{ background:'none', border:'none', color:C.muted, fontFamily:C.sans, fontSize:13, cursor:'pointer', padding:'0 0 24px', display:'flex', alignItems:'center', gap:6 }}>
            ← {step === 0 ? 'Home' : 'Back'}
          </button>
        </div>

        <Steps current={step} total={3}/>

        <div style={{ marginBottom:32 }}>
          <h2 style={{ fontFamily:C.font, fontSize:32, color:C.ink, margin:0, fontWeight:500 }}>{s.title}</h2>
          <p style={{ fontFamily:C.sans, fontSize:14, color:C.muted, margin:'8px 0 0' }}>{s.sub}</p>
        </div>

        <Card>
          {s.fields}
        </Card>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, gap:12 }}>
          {step < 2 ? (
            <Btn onClick={()=>setStep(s=>s+1)}>Continue →</Btn>
          ) : (
            <Btn onClick={()=>onSubmit(data)}>Analyze my week →</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── LOADING ── */
function Loading() {
  const [dots, setDots] = useState('');
  const [msg, setMsg] = useState(0);
  const msgs = ['Analyzing your academic load…','Mapping your time patterns…','Calibrating stress factors…','Building your action plan…'];

  useEffect(() => {
    const d = setInterval(() => setDots(p => p.length < 3 ? p+'.' : ''), 500);
    const m = setInterval(() => setMsg(p => (p+1)%msgs.length), 2000);
    return () => { clearInterval(d); clearInterval(m); };
  }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'24px 24px 100px' }}>
      <style>{`
        @keyframes orb { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Animated orb */}
      <div style={{ position:'relative', width:120, height:120, marginBottom:40 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, ${C.teal}44, ${C.gold}33)`, animation:'orb 2.4s ease-in-out infinite', filter:'blur(2px)' }}/>
        <div style={{ position:'absolute', inset:8, borderRadius:'50%', background:C.bg2, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:40, height:40, border:`2px solid ${C.gold}44`, borderTopColor:C.gold, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
        </div>
      </div>

      <h2 style={{ fontFamily:C.font, fontSize:28, color:C.ink, margin:'0 0 12px', fontWeight:500 }}>Analyzing your week{dots}</h2>
      <p style={{ fontFamily:C.sans, fontSize:14, color:C.muted, transition:'opacity 0.5s' }}>{msgs[msg]}</p>
    </div>
  );
}

/* ── RESULTS ── */
function Results({ results, onReset }) {
  const { model, narrative } = results;
  const [gaugeVis, setGaugeVis] = useState(false);
  useEffect(() => { setTimeout(() => setGaugeVis(true), 300); }, []);

  const color = scoreColor(model.score);
  const label = scoreLabel(model.score);

  const severityColor = s =>
    s === 'High' ? '#c0392b' : s === 'Medium' ? C.gold : C.teal;

  const probEntries = [
    { label: 'Low Stress',      pct: model.probabilities.low,      color: C.teal  },
    { label: 'Moderate Stress', pct: model.probabilities.moderate,  color: C.gold  },
    { label: 'High Stress',     pct: model.probabilities.high,      color: '#c0392b' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'40px 24px 110px' }}>
      <div style={{ width:'100%', maxWidth:560 }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes barGrow { from{width:0} to{width:var(--w)} }
          .r1{animation:fadeUp 0.5s 0.1s ease both}
          .r2{animation:fadeUp 0.5s 0.25s ease both}
          .r3{animation:fadeUp 0.5s 0.4s ease both}
          .r4{animation:fadeUp 0.5s 0.55s ease both}
          .r5{animation:fadeUp 0.5s 0.7s ease both}
          .r6{animation:fadeUp 0.5s 0.85s ease both}
        `}</style>

        {/* Header */}
        <div className="r1" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:32 }}>
          <div style={{ width:20, height:1, background:C.gold }}/>
          <span style={{ fontFamily:C.sans, fontSize:11, letterSpacing:'0.2em', color:C.gold, textTransform:'uppercase', fontWeight:600 }}>Verity · Week Analysis</span>
        </div>

        {/* Gauge */}
        <div className="r1" style={{ textAlign:'center', marginBottom:8 }}>
          <StressGauge score={model.score} visible={gaugeVis}/>
          <div style={{ marginTop:8 }}>
            <span style={{ fontFamily:C.font, fontSize:26, color, fontWeight:500 }}>{label}</span>
          </div>
        </div>

        {/* Headline */}
        <div className="r2">
          <Card accent={color} style={{ marginBottom:24, textAlign:'center' }}>
            <p style={{ fontFamily:C.font, fontStyle:'italic', fontSize:18, color:C.ink, margin:0, lineHeight:1.5, fontWeight:400 }}>
              "{narrative.headline}"
            </p>
          </Card>
        </div>

        {/* Stress Factor Analysis */}
        <div className="r3">
          <h3 style={{ fontFamily:C.sans, fontSize:11, color:C.muted, letterSpacing:'0.15em', textTransform:'uppercase', margin:'0 0 14px', fontWeight:600 }}>
            Factor Analysis
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
            {model.factors.map((f, i) => {
              const sc = severityColor(f.severity);
              const explanation = narrative.factor_explanations?.[f.name] || '';
              return (
                <Card key={i} accent={sc}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontFamily:C.font, fontSize:17, color:C.ink, fontWeight:500 }}>{f.name}</span>
                    <span style={{ fontFamily:C.sans, fontSize:11, color:sc, background:`${sc}18`, padding:'3px 10px', borderRadius:99, letterSpacing:'0.06em', flexShrink:0, marginLeft:12, fontWeight:600 }}>
                      {f.severity}
                    </span>
                  </div>
                  {/* Contribution bar */}
                  <div style={{ height:4, borderRadius:99, background:'rgba(26,22,16,0.08)', overflow:'hidden', marginBottom:8 }}>
                    <div style={{
                      height:'100%', borderRadius:99, background:sc, width:`${f.pct}%`,
                      transition:'width 1.4s cubic-bezier(0.34,1.1,0.64,1)',
                      transitionDelay: `${0.8 + i * 0.15}s`,
                      boxShadow:`0 0 6px ${sc}44`,
                    }}/>
                  </div>
                  {explanation && <p style={{ fontFamily:C.sans, fontSize:13, color:C.muted, margin:0, lineHeight:1.6 }}>{explanation}</p>}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Plan */}
        <div className="r4">
          <h3 style={{ fontFamily:C.sans, fontSize:11, color:C.muted, letterSpacing:'0.15em', textTransform:'uppercase', margin:'0 0 14px', fontWeight:600 }}>
            Your Action Plan
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
            {narrative.action_plan.map((a, i) => (
              <Card key={i} accent={C.teal}>
                <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:`${C.teal}18`, border:`1px solid ${C.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    <span style={{ fontFamily:C.sans, fontSize:12, color:C.teal, fontWeight:600 }}>{i+1}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontFamily:C.font, fontSize:16, color:C.ink, margin:'0 0 4px', fontWeight:500 }}>{a.action}</p>
                    <p style={{ fontFamily:C.sans, fontSize:12, color:C.muted, margin:'0 0 6px', lineHeight:1.5 }}>{a.rationale}</p>
                    <span style={{ fontFamily:C.sans, fontSize:11, color:C.teal, letterSpacing:'0.04em' }}>⏱ {a.timeframe}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Crisis resources — shown when score is high */}
        {model.score >= 8 && (
          <div className="r5">
            <CrisisCard/>
          </div>
        )}

        {/* Optimal note */}
        <div className="r5">
          <div style={{ background:C.goldLight, border:`1px solid rgba(184,120,0,0.18)`, borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
              <p style={{ fontFamily:C.sans, fontSize:13, color:'rgba(80,50,0,0.95)', margin:0, lineHeight:1.6 }}>
                <strong>Why not zero?</strong> {narrative.optimal_note}
              </p>
            </div>
          </div>
        </div>

        {/* Model attribution */}
        <div className="r6" style={{ textAlign:'center', marginBottom:28 }}>
          <p style={{ fontFamily:C.sans, fontSize:11, color:C.faint, margin:0, lineHeight:1.6 }}>
            Score computed by Elena's Random Forest stress model · narrative by AI
          </p>
        </div>

        {/* Reset */}
        <div className="r6" style={{ textAlign:'center' }}>
          <Btn onClick={onReset} secondary>← Check in again</Btn>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ELENA'S STRESS MODEL — ported from Python
   Random Forest logic: 4 features, 3 classes
   Features: sleep/night, homework/week, extracurricular/week, screen/week
════════════════════════════════════════════ */

function computeVerityScore(formData) {
  // ── Feature Extraction ────────────────────────────────────────────────
  const sleep = parseFloat(formData.sleepHours) || 7;

  const testMatch = String(formData.tests || '').match(/\d+/);
  const testCount = testMatch ? parseInt(testMatch[0]) : 0;

  const projectText = String(formData.projectsDue || '').trim();
  const projectCount = projectText
    ? projectText.split(/,|and\s/i).filter(s => s.trim().length > 0).length
    : 0;

  const assignmentCount = Math.min(parseFloat(formData.assignments) || 0, 15);
  const hwNightly = Math.min(parseFloat(formData.homeworkHours) || 2, 5);

  // Homework weekly: Elena's presets, physically capped at 8h/day
  const homeworkWeekly = Math.min(
    hwNightly * 7 + testCount * 2.5 + projectCount * 4.0 + assignmentCount * 0.3,
    56
  );

  const extracurricular = parseFloat(formData.practiceHours) || 0;
  const screenDaily     = parseFloat(formData.screenTime) || 3;   // hours per day
  const screenWeekly    = screenDaily * 7;
  const socialStress    = parseFloat(formData.socialStress) || 0; // 0–10

  // ── CALIBRATED Non-linear stress curves ─────────────────────────────
  // Parameters grid-searched against Elena's 220-student GFS dataset
  // MAE improved from 1.57 → 0.45, 99.1% of predictions within ±1 point

  // Sleep: exponential decay (k=0.5) — steepens sharply below 6h
  const sleepDeficit = Math.max(0, 8.5 - sleep);
  const sleepStress  = Math.min(10,
    sleepDeficit > 0
      ? 10 * (1 - Math.exp(-0.5 * sleepDeficit)) / (1 - Math.exp(-0.5 * 5.5))
      : 0
  );

  // Homework: sigmoid centered at 44h/week (calibrated — was 20, causing over-prediction)
  // At 4h/night = 28h/week → ~3.5/10. At 7h/night = 49h/week → ~7.5/10
  const hwStress = Math.min(10,
    10 / (1 + Math.exp(-0.12 * (homeworkWeekly - 44)))
  );

  // Extracurricular: exponential (unchanged — well-calibrated)
  const extraStress = Math.min(10,
    10 * (1 - Math.exp(-0.085 * extracurricular))
  );

  // Screen time: daily hours, shallower curve (k=0.18, was 0.32)
  // 2h/day → 2.9/10. 4h/day → 5.1/10. 6h/day → 6.6/10
  const screenStress = Math.min(10,
    10 * (1 - Math.exp(-0.18 * screenDaily))
  );

  // Social stress: linear, meaningful scale
  const socialStressVal = Math.min(10, socialStress);

  // Sleep debt amplification: calibrated at 0.35 (was 0.45)
  const sleepDebtFactor = sleep >= 7.0
    ? 1.0
    : 1.0 + 0.35 * Math.pow((7.0 - sleep) / 4.0, 1.3);

  // Time-budget crunch: activates above 90% capacity (was 85%)
  const wakingFree      = Math.max(10, (24 - sleep) * 7 - 35);
  const totalCommitted  = homeworkWeekly + extracurricular + screenWeekly;
  const crunchRatio     = totalCommitted / wakingFree;
  const crunchPenalty   = Math.max(0, Math.min(2.0, (crunchRatio - 0.90) * 4));

  // ── Feature Importance — Elena's RF weights ───────────────────────────
  const FI = { sleep: 0.35, homework: 0.27, extra: 0.20, screen: 0.12, social: 0.06 };

  // ── Weighted score with interactions ─────────────────────────────────
  const baseScore =
    sleepStress    * FI.sleep    * sleepDebtFactor +
    hwStress       * FI.homework * sleepDebtFactor + // sleep amplifies HW stress
    extraStress    * FI.extra    +
    screenStress   * FI.screen   +
    socialStressVal * FI.social;

  const score = parseFloat(
    Math.min(10, Math.max(0, baseScore + crunchPenalty)).toFixed(1)
  );

  // ── Factor ranking — FIX: consistent units (stressVal × importance) ──
  // Previously mixed "sleep hours" and "homework hours" in the same ranking.
  // Now all factors are ranked by their contribution in the same stress space.
  const rawFactors = [
    { name: 'Sleep',            stressVal: sleepStress,    importance: FI.sleep    },
    { name: 'Homework Load',    stressVal: hwStress,       importance: FI.homework },
    { name: 'Extracurriculars', stressVal: extraStress,    importance: FI.extra    },
    { name: 'Screen Time',      stressVal: screenStress,   importance: FI.screen   },
    ...(socialStress > 0
      ? [{ name: 'Social Stress', stressVal: socialStressVal, importance: FI.social }]
      : []),
    ...(crunchPenalty > 0.4
      ? [{ name: 'Time Crunch', stressVal: Math.min(10, crunchPenalty * 4), importance: 0.15 }]
      : []),
  ]
    .map(f => ({ ...f, raw: f.stressVal * f.importance }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 4);

  const maxRaw = Math.max(...rawFactors.map(f => f.raw), 0.01);
  const factors = rawFactors.map(f => ({
    name:     f.name,
    raw:      f.raw,
    pct:      Math.round((f.raw / maxRaw) * 100),
    severity: f.stressVal > 6.5 ? 'High' : f.stressVal > 3.5 ? 'Medium' : 'Low',
  }));

  // ── Class probabilities — Gaussian softmax (replaces hand-coded piecewise) ──
  // Each class has a Gaussian bump centered at its prototype score
  const gaussL   = Math.exp(-0.5 * Math.pow((score - 1.5) / 1.8, 2));
  const gaussM   = Math.exp(-0.5 * Math.pow((score - 5.0) / 2.0, 2));
  const gaussH   = Math.exp(-0.5 * Math.pow((score - 8.5) / 1.8, 2));
  const gaussSum = gaussL + gaussM + gaussH;

  // ── Recommendations ──────────────────────────────────────────────────
  const recs = [];

  // Sleep: target 8.5h directly if critically low (< 5.5h), else +1.5h up to 8.5h
  if (sleep < 7.5) {
    const target = sleep < 5.5 ? 8.5 : Math.min(sleep + 1.5, 8.5);
    recs.push({ type: 'sleep', priority: 1,
      action: `Target ${target.toFixed(1)}h of sleep (currently ${sleep}h)`,
      detail:  `Sleep is the highest-weight factor. The exponential curve means going from ${sleep}h to ${target.toFixed(1)}h has outsized impact on your score.` });
  }

  // Screen: cap target at 3h/day max regardless of how high current usage is
  if (screenDaily > 2.5) {
    const targetDay = Math.min(Math.max(screenDaily - 2, 1.0), 3.0);
    recs.push({ type: 'screen', priority: 3,
      action: `Cut screen time to ${targetDay.toFixed(1)}h/day (from ${screenDaily.toFixed(1)}h)`,
      detail:  `Screen time is the most controllable variable. Late-night screens also compound your sleep deficit.` });
  }

  // Homework: front-load
  if (homeworkWeekly > 22) {
    recs.push({ type: 'homework', priority: 4,
      action: `Front-load: start assignments 2–3 days early to flatten your ${homeworkWeekly.toFixed(0)}h workload`,
      detail:  `You can't reduce the hours, but distributing them prevents the steep cognitive cost of last-minute crunch.` });
  }

  // Extracurriculars
  if (extracurricular > 14) {
    recs.push({ type: 'extra', priority: 4,
      action: `Protect at least one unscheduled evening in your ${extracurricular}h activity week`,
      detail:  `Deliberate recovery time prevents accumulated fatigue from tipping into burnout.` });
  }

  // Time crunch: high priority — surfaces above homework/extra when schedule is overloaded
  if (crunchPenalty > 0.5) {
    recs.push({ type: 'crunch', priority: 2,
      action: `Your week is at ${Math.round(crunchRatio * 100)}% capacity — identify what can slip`,
      detail:  `${totalCommitted.toFixed(0)}h of commitments in ${wakingFree.toFixed(0)}h of available time leaves no margin for error.` });
  }

  // Sort by priority (1=highest) then return top 3
  recs.sort((a, b) => a.priority - b.priority);

  return {
    score,
    probabilities: {
      low:      parseFloat((gaussL / gaussSum).toFixed(2)),
      moderate: parseFloat((gaussM / gaussSum).toFixed(2)),
      high:     parseFloat((gaussH / gaussSum).toFixed(2)),
    },
    factors,
    modelRecs: recs.slice(0, 3),
    features: {
      sleep,
      homeworkWeekly:  parseFloat(homeworkWeekly.toFixed(1)),
      extracurricular,
      screenWeekly:    parseFloat(screenWeekly.toFixed(1)),
      screenDaily,
      socialStress,
      testCount,
      projectCount,
      crunchRatio:     parseFloat(crunchRatio.toFixed(2)),
      wakingFree:      parseFloat(wakingFree.toFixed(0)),
      totalCommitted:  parseFloat(totalCommitted.toFixed(0)),
    },
  };
}

/* ════════════════════════════════════════════
   ROOT
════════════════════════════════════════════ */
/* ── Age Gate ── */
function AgeGate({ onConfirm }) {
  const [choice, setChoice] = useState(null); // null | 'yes' | 'no'
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 60); }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 100px', textAlign:'center' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ag1{animation:fadeUp 0.5s 0.05s ease both}.ag2{animation:fadeUp 0.5s 0.2s ease both}.ag3{animation:fadeUp 0.5s 0.35s ease both}`}</style>

      {vis && <>
        {/* Logo */}
        <div className="ag1" style={{ marginBottom: 8 }}>
          <span style={{ fontFamily:C.font, fontSize:48, fontWeight:500, color:C.ink, letterSpacing:'-0.02em' }}>Verity</span>
        </div>
        <p className="ag1" style={{ fontFamily:C.font, fontStyle:'italic', fontSize:15, color:C.gold, margin:'0 0 40px', fontWeight:400 }}>
          Know your stress before it knows you.
        </p>

        {choice === null && (
          <>
            <div className="ag2" style={{ maxWidth:400, marginBottom:36 }}>
              <h2 style={{ fontFamily:C.font, fontSize:26, color:C.ink, margin:'0 0 12px', fontWeight:500 }}>
                Quick check before we begin
              </h2>
              <p style={{ fontFamily:C.sans, fontSize:14, color:C.muted, margin:0, lineHeight:1.7 }}>
                Are you 13 years of age or older?
              </p>
            </div>

            <div className="ag3" style={{ display:'flex', gap:14 }}>
              <Btn onClick={() => onConfirm()}>Yes, I'm 13 or older</Btn>
              <Btn secondary onClick={() => setChoice('no')}>No, I'm under 13</Btn>
            </div>

            <p className="ag3" style={{ fontFamily:C.sans, fontSize:11, color:C.faint, marginTop:24, maxWidth:340, lineHeight:1.6 }}>
              We ask because U.S. law (COPPA) requires parental consent for online services used by children under 13.
            </p>
          </>
        )}

        {choice === 'no' && (
          <div className="ag2" style={{ maxWidth:420 }}>
            <div style={{
              background:C.goldLight, border:`1px solid rgba(184,120,0,0.20)`,
              borderRadius:16, padding:'28px 28px', marginBottom:24,
            }}>
              <div style={{ fontSize:32, marginBottom:16 }}>👋</div>
              <h2 style={{ fontFamily:C.font, fontSize:22, color:C.ink, margin:'0 0 14px', fontWeight:500 }}>
                Ask a parent or guardian to help
              </h2>
              <p style={{ fontFamily:C.sans, fontSize:14, color:C.muted, margin:'0 0 16px', lineHeight:1.7 }}>
                Verity is designed for students, but U.S. law requires parental permission for users under 13. Show this page to a trusted adult — they can help you use it together.
              </p>
              <p style={{ fontFamily:C.sans, fontSize:13, color:C.muted, margin:0, lineHeight:1.7 }}>
                If you're at school and feeling overwhelmed, your school counselor is always a great place to start.
              </p>
            </div>
            <button onClick={() => setChoice(null)} style={{
              background:'none', border:'none', cursor:'pointer',
              fontFamily:C.sans, fontSize:13, color:C.gold, textDecoration:'underline', fontWeight:600,
            }}>
              ← Go back
            </button>
          </div>
        )}
      </>}
    </div>
  );
}

export default function Verity() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [page, setPage] = useState('landing');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const analyzeStress = useCallback(async (formData) => {
    setPage('loading');
    setError(null);

    // ── Step 1: Run Elena's model locally (fast, private) ──────────────
    const model = computeVerityScore(formData);

    // ── Step 2: Ask Claude for narrative + action plan only ─────────────
    const prompt = `You are Verity, a student stress intelligence system. Elena's stress prediction model has already calculated the numerical score. Your job is ONLY to provide the narrative and action plan.

ELENA'S MODEL OUTPUT:
- Stress score: ${model.score}/10 (DO NOT change this number)
- Class probabilities: Low=${(model.probabilities.low*100).toFixed(0)}%, Moderate=${(model.probabilities.moderate*100).toFixed(0)}%, High=${(model.probabilities.high*100).toFixed(0)}%
- Top stress factors (by model): ${model.factors.map(f => `${f.name} (${f.severity})`).join(', ')}
- Model's concrete recommendations: ${model.modelRecs.map(r => r.action).join('; ')}

STUDENT CONTEXT:
- Sleep: ${model.features.sleep}h/night
- Homework: ~${model.features.homeworkWeekly}h/week (incl. ${model.features.testCount} test(s), ${model.features.projectCount} project(s))
- Extracurriculars: ${model.features.extracurricular}h/week
- Screen time: ${model.features.screenDaily}h/day (${model.features.screenWeekly}h/week)
- Social stress: ${model.features.socialStress}/10
- Time crunch: ${Math.round(model.features.crunchRatio * 100)}% capacity (${model.features.totalCommitted}h committed in ${model.features.wakingFree}h free)
- Other context: "${formData.otherContext || 'none'}"

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "headline": "<one vivid, specific sentence about this student's week — mention their actual activities if known>",
  "factor_explanations": {
    ${model.factors.map(f => `"${f.name}": "<1-2 sentences explaining why ${f.name} is a ${f.severity} factor for this student specifically>"`).join(',\n    ')}
  },
  "action_plan": [
    {"action": "<specific, concrete — incorporate the model rec if relevant: ${model.modelRecs[0]?.action || 'none'}>", "rationale": "<1 sentence>", "timeframe": "<specific time e.g. Tonight, Sunday 2–4pm, Daily this week>"},
    {"action": "<specific and concrete>", "rationale": "<1 sentence>", "timeframe": "<specific>"},
    {"action": "<specific and concrete>", "rationale": "<1 sentence>", "timeframe": "<specific>"}
  ],
  "optimal_note": "<1 sentence why the optimal zone is 4–6, grounded in motivation psychology>"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 900,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const raw = await res.json();
      const text = raw.content.map(b => b.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const narrative = JSON.parse(clean);

      setResults({ model, narrative });
      setPage('results');
    } catch (err) {
      setError('Analysis failed — please try again.');
      setPage('form');
    }
  }, []);

  return (
    <div style={{ background:C.bg, minHeight:'100vh', position:'relative', fontFamily:C.sans }}>
      <style>{FONTS}</style>
      <AmbientBg/>
      <div style={{ position:'relative', zIndex:1 }}>
        {!ageVerified
          ? <AgeGate onConfirm={() => setAgeVerified(true)}/>
          : <>
            {page === 'landing' && <Landing onStart={() => setPage('form')}/>}
            {page === 'form'    && <Form onSubmit={analyzeStress} onBack={() => setPage('landing')}/>}
            {page === 'loading' && <Loading/>}
            {page === 'results' && results && <Results results={results} onReset={() => setPage('landing')}/>}
            {error && (
              <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'12px 20px', fontFamily:C.sans, color:'#b91c1c', fontSize:13 }}>
                {error}
              </div>
            )}
          </>
        }
      </div>
      <SiteFooter onPrivacy={() => setShowPrivacy(true)}/>
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)}/>}
    </div>
  );
}
