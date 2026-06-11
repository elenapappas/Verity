"""
Verity — Student Stress Intelligence
Built by Elena Pappas for the Mott Million Dollar Challenge

Run:  streamlit run app.py
"""

import json
import streamlit as st
import plotly.graph_objects as go
import anthropic

from model import compute_verity_score, score_label, score_color

# ── Page config ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Verity · Student Stress Intelligence",
    page_icon="🎯",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ── Global CSS ─────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500;600&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
}
h1, h2, h3 {
    font-family: 'Fraunces', serif !important;
    font-weight: 500 !important;
}

/* Background */
.stApp { background-color: #f7f4ef; }

/* Hide default Streamlit chrome */
#MainMenu, footer, header { visibility: hidden; }
.block-container { padding-top: 2rem; padding-bottom: 4rem; max-width: 600px; }

/* Buttons */
.stButton > button {
    background: #1a1610 !important;
    color: #f7f4ef !important;
    border: none !important;
    border-radius: 99px !important;
    padding: 0.6rem 1.8rem !important;
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    letter-spacing: 0.04em !important;
    transition: opacity 0.2s !important;
}
.stButton > button:hover { opacity: 0.82 !important; }

/* Secondary button */
.secondary > button {
    background: transparent !important;
    color: #1a1610 !important;
    border: 1px solid rgba(26,22,16,0.25) !important;
}

/* Sliders */
.stSlider [data-baseweb="slider"] { margin-top: 0.3rem; }

/* Cards */
.verity-card {
    background: #ffffff;
    border: 1px solid rgba(26,22,16,0.08);
    border-radius: 16px;
    padding: 20px 22px;
    margin-bottom: 14px;
    box-shadow: 0 2px 8px rgba(26,22,16,0.05);
}
.verity-card-accent {
    border-left: 3px solid var(--accent);
}

/* Labels */
.field-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(26,22,16,0.65);
    margin-bottom: 4px;
}

/* Disclaimer footer */
.disclaimer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, #f7f4ef 70%, transparent);
    padding: 14px 24px 10px;
    text-align: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: rgba(26,22,16,0.48);
    z-index: 100;
}

/* Severity badges */
.badge-high   { color: #c0392b; background: rgba(192,57,43,0.10); padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.badge-medium { color: #b87800; background: rgba(184,120,0,0.12); padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.badge-low    { color: #0f7a60; background: rgba(15,122,96,0.10);  padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }

/* Gold rule */
.gold-rule {
    display: flex; align-items: center; gap: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 11px;
    letter-spacing: 0.2em; color: #b87800; text-transform: uppercase;
    font-weight: 600; margin-bottom: 1.5rem;
}
</style>
""", unsafe_allow_html=True)

DISCLAIMER_HTML = """
<div class="disclaimer">
  Verity is a self-reflection tool, not a clinical assessment.
  It is not a substitute for talking to a school counselor, therapist, or trusted adult.
</div>
"""

# ── Session state ──────────────────────────────────────────────────────
DEFAULTS = dict(
    page         = 'age_gate',   # age_gate | landing | form | results
    form_step    = 1,            # 1 | 2 | 3
    form_data    = {},
    results      = None,
    show_privacy = False,
)
for k, v in DEFAULTS.items():
    if k not in st.session_state:
        st.session_state[k] = v


# ── Helpers ────────────────────────────────────────────────────────────
def go_to(page):
    st.session_state.page = page
    st.rerun()


def gauge_figure(score: float) -> go.Figure:
    color = score_color(score)
    fig = go.Figure(go.Indicator(
        mode  = "gauge+number",
        value = score,
        number= dict(font=dict(family="Fraunces, serif", size=52, color=color),
                     suffix="", valueformat=".1f"),
        gauge = dict(
            axis = dict(range=[0, 10], tickwidth=1, tickcolor="#1a1610",
                        tickfont=dict(family="DM Sans", size=11),
                        tickvals=[0,2,4,6,8,10]),
            bar  = dict(color=color, thickness=0.25),
            bgcolor   = "rgba(0,0,0,0)",
            borderwidth=0,
            steps=[
                dict(range=[0,  2],  color="rgba(46,204,113,0.12)"),
                dict(range=[2,  4],  color="rgba(39,174,96,0.10)"),
                dict(range=[4,  6],  color="rgba(243,156,18,0.12)"),
                dict(range=[6,  7.5],color="rgba(230,126,34,0.12)"),
                dict(range=[7.5,9],  color="rgba(231,76,60,0.12)"),
                dict(range=[9, 10],  color="rgba(192,57,43,0.15)"),
            ],
            threshold=dict(
                line=dict(color=color, width=3),
                thickness=0.75, value=score,
            ),
        ),
    ))
    fig.update_layout(
        height=220, margin=dict(t=20, b=10, l=30, r=30),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="DM Sans, sans-serif"),
    )
    return fig


def bar_html(pct: int, color: str) -> str:
    return f"""
    <div style="height:5px;border-radius:99px;background:rgba(26,22,16,0.08);overflow:hidden;margin:6px 0 10px">
      <div style="width:{pct}%;height:100%;border-radius:99px;background:{color};
                  box-shadow:0 0 6px {color}55"></div>
    </div>"""


def get_narrative(model_result: dict, form_data: dict) -> dict:
    """Call Anthropic API server-side to generate narrative text."""
    f = model_result['features']
    recs_text = "; ".join(r['action'] for r in model_result['model_recs']) or "none"
    factors_list = ", ".join(
        f"{fac['name']} ({fac['severity']})" for fac in model_result['factors']
    )

    prompt = f"""You are Verity, a student stress intelligence system. Elena's model has already computed the score — do NOT change it. Generate only narrative text.

ELENA'S MODEL OUTPUT:
- Stress score: {model_result['score']}/10 (DO NOT change this)
- Top factors: {factors_list}
- Model recommendations: {recs_text}

STUDENT CONTEXT:
- Sleep: {f['sleep']}h/night
- Homework: ~{f['homework_weekly']}h/week (incl. {f['test_count']} test(s), {f['proj_count']} project(s))
- Extracurriculars: {f['extracurricular']}h/week
- Screen time: {f['screen_daily']}h/day
- Social stress: {f['social_stress']}/10
- Time crunch: {round(f['crunch_ratio']*100)}% capacity
- Other context: "{form_data.get('other_context','none')}"

Respond ONLY with a JSON object, no markdown, no preamble:
{{
  "headline": "<one vivid sentence specific to this student's week>",
  "factor_explanations": {{
    {chr(10).join(f'"{fac["name"]}": "<1-2 sentences why this is {fac["severity"]} for this student>"' for fac in model_result['factors'])}
  }},
  "action_plan": [
    {{"action": "<specific, concrete>", "rationale": "<1 sentence>", "timeframe": "<e.g. Tonight, Sunday 2-4pm>"}},
    {{"action": "<specific, concrete>", "rationale": "<1 sentence>", "timeframe": "<specific>"}},
    {{"action": "<specific, concrete>", "rationale": "<1 sentence>", "timeframe": "<specific>"}}
  ],
  "optimal_note": "<1 sentence why 4-6 is the target, not zero>"
}}"""

    try:
        client = anthropic.Anthropic(api_key=st.secrets["ANTHROPIC_API_KEY"])
        message = client.messages.create(
            model      = "claude-sonnet-4-6",
            max_tokens = 900,
            messages   = [{"role": "user", "content": prompt}]
        )
        text  = message.content[0].text
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        # Graceful fallback — show model results without narrative enrichment
        return dict(
            headline        = f"Your stress index is {model_result['score']}/10 this week.",
            factor_explanations = {f['name']: "" for f in model_result['factors']},
            action_plan     = [dict(action=r['action'], rationale=r['detail'], timeframe="This week")
                               for r in model_result['model_recs']],
            optimal_note    = "Research shows a score of 4–6 represents the optimal zone for motivation and performance.",
        )


# ══════════════════════════════════════════════════════════════════════
#  PAGES
# ══════════════════════════════════════════════════════════════════════

def page_age_gate():
    st.markdown("<br><br>", unsafe_allow_html=True)
    col = st.columns([1, 4, 1])[1]
    with col:
        st.markdown('<h1 style="font-size:3rem;text-align:center;color:#1a1610;margin-bottom:4px">Verity</h1>', unsafe_allow_html=True)
        st.markdown('<p style="text-align:center;font-family:Fraunces,serif;font-style:italic;color:#b87800;margin-bottom:2.5rem">Know your stress before it knows you.</p>', unsafe_allow_html=True)

        st.markdown("""
        <div class="verity-card" style="text-align:center">
          <h3 style="font-size:1.3rem;margin-bottom:0.5rem">Quick check before we begin</h3>
          <p style="color:rgba(26,22,16,0.65);font-size:14px;margin-bottom:1rem">
            Are you 13 years of age or older?
          </p>
        </div>""", unsafe_allow_html=True)

        c1, c2 = st.columns(2)
        with c1:
            if st.button("Yes, I'm 13 or older", use_container_width=True):
                go_to('landing')
        with c2:
            if st.button("No, I'm under 13", use_container_width=True, type="secondary"):
                st.session_state.page = 'under_13'
                st.rerun()

        st.markdown("""
        <p style="text-align:center;font-size:11px;color:rgba(26,22,16,0.42);margin-top:1rem;line-height:1.6">
          U.S. law (COPPA) requires parental consent for online services used by children under 13.
        </p>""", unsafe_allow_html=True)


def page_under_13():
    st.markdown("<br><br>", unsafe_allow_html=True)
    col = st.columns([1, 4, 1])[1]
    with col:
        st.markdown("""
        <div class="verity-card" style="background:#fffbf0;border:1px solid rgba(184,120,0,0.2);text-align:center">
          <div style="font-size:2rem;margin-bottom:12px">👋</div>
          <h3 style="font-size:1.2rem;margin-bottom:10px">Ask a parent or guardian to help</h3>
          <p style="color:rgba(26,22,16,0.65);font-size:13px;line-height:1.7;margin-bottom:12px">
            Verity is designed for students, but U.S. law requires parental permission
            for users under 13. Show this page to a trusted adult — they can help you use it together.
          </p>
          <p style="color:rgba(26,22,16,0.65);font-size:13px;line-height:1.7">
            If you're feeling overwhelmed right now, your school counselor is always a great place to start.
          </p>
        </div>""", unsafe_allow_html=True)

        if st.button("← Go back", type="secondary"):
            go_to('age_gate')


def page_landing():
    st.markdown("<br>", unsafe_allow_html=True)

    st.markdown('<h1 style="font-size:3rem;text-align:center;color:#1a1610;margin-bottom:4px">Verity</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align:center;font-family:Fraunces,serif;font-style:italic;color:#b87800;margin-bottom:0.5rem">Know your stress before it knows you.</p>', unsafe_allow_html=True)

    st.markdown("""
    <p style="text-align:center;color:rgba(26,22,16,0.65);font-size:14px;line-height:1.7;max-width:440px;margin:0 auto 2rem">
      Log your weekly schedule and receive a personalized stress prediction —
      with an actionable plan to bring it down before Monday hits.
    </p>""", unsafe_allow_html=True)

    # Stats
    c1, c2, c3 = st.columns(3)
    for col, stat, label in [
        (c1, "1 in 7", "adolescents affected"),
        (c2, "166M", "young people worldwide"),
        (c3, "0–10", "stress index"),
    ]:
        with col:
            st.markdown(f"""
            <div class="verity-card" style="text-align:center;padding:16px 10px">
              <div style="font-family:Fraunces,serif;font-size:1.6rem;color:#1a1610">{stat}</div>
              <div style="font-size:11px;color:rgba(26,22,16,0.55);margin-top:4px">{label}</div>
            </div>""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    col = st.columns([1, 2, 1])[1]
    with col:
        if st.button("Check in on this week →", use_container_width=True):
            st.session_state.form_step = 1
            st.session_state.form_data = {}
            go_to('form')

    st.markdown("""
    <p style="text-align:center;font-size:11px;color:rgba(26,22,16,0.42);margin-top:1rem">
      🔒 Your data never leaves this session. No accounts, no tracking.
    </p>""", unsafe_allow_html=True)


def page_form():
    fd = st.session_state.form_data
    step = st.session_state.form_step

    # Progress
    st.markdown(f"""
    <div style="display:flex;gap:6px;justify-content:center;margin-bottom:1.5rem">
      {''.join(f'<div style="width:60px;height:3px;border-radius:99px;background:{"#1a1610" if i<=step else "rgba(26,22,16,0.15)"}"></div>' for i in range(1,4))}
    </div>""", unsafe_allow_html=True)

    if step == 1:
        st.markdown('<h2 style="text-align:center;font-size:1.5rem;margin-bottom:0.2rem">Academic Load</h2>', unsafe_allow_html=True)
        st.markdown('<p style="text-align:center;color:rgba(26,22,16,0.55);font-size:13px;margin-bottom:1.5rem">What\'s on your plate this week?</p>', unsafe_allow_html=True)

        fd['assignments'] = st.slider("Assignments due this week", 0, 15,
                                       int(fd.get('assignments', 3)))
        fd['tests']       = st.text_input("Upcoming tests or quizzes",
                                           value=fd.get('tests',''),
                                           placeholder="e.g. 2 tests, AP Bio quiz")
        fd['homework_hours'] = st.slider("Homework hours per night", 0.0, 5.0,
                                          float(fd.get('homework_hours', 2.0)), step=0.5)
        fd['projects_due'] = st.text_input("Major projects or papers due",
                                            value=fd.get('projects_due',''),
                                            placeholder="e.g. history essay, lab report")

        st.markdown("<br>", unsafe_allow_html=True)
        col = st.columns([1,2,1])[1]
        with col:
            if st.button("Continue →", use_container_width=True):
                st.session_state.form_step = 2
                st.rerun()

    elif step == 2:
        st.markdown('<h2 style="text-align:center;font-size:1.5rem;margin-bottom:0.2rem">Your Schedule</h2>', unsafe_allow_html=True)
        st.markdown('<p style="text-align:center;color:rgba(26,22,16,0.55);font-size:13px;margin-bottom:1.5rem">Time is the real resource.</p>', unsafe_allow_html=True)

        fd['practice_hours'] = st.slider("Extracurricular hours this week", 0, 30,
                                          int(fd.get('practice_hours', 5)))
        fd['sleep_hours']    = st.slider("Average sleep per night", 3.0, 12.0,
                                          float(fd.get('sleep_hours', 7.0)), step=0.5)
        fd['screen_time']    = st.slider("Daily screen time (non-school)", 0.0, 12.0,
                                          float(fd.get('screen_time', 3.0)), step=0.5)

        st.markdown("<br>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            if st.button("← Back", use_container_width=True, type="secondary"):
                st.session_state.form_step = 1
                st.rerun()
        with c2:
            if st.button("Continue →", use_container_width=True):
                st.session_state.form_step = 3
                st.rerun()

    elif step == 3:
        st.markdown('<h2 style="text-align:center;font-size:1.5rem;margin-bottom:0.2rem">Context</h2>', unsafe_allow_html=True)
        st.markdown('<p style="text-align:center;color:rgba(26,22,16,0.55);font-size:13px;margin-bottom:1.5rem">Stress is rarely just academic.</p>', unsafe_allow_html=True)

        fd['social_stress']  = st.slider(
            "Social & relationship stress this week",
            0, 10, int(fd.get('social_stress', 2)),
            help="Friend conflicts, family tension, romantic stress, social pressure…"
        )
        fd['other_context']  = st.text_area("Anything else on your mind?",
                                             value=fd.get('other_context',''),
                                             placeholder="e.g. college apps, a tough week at home…",
                                             height=80)

        st.markdown("""
        <p style="font-size:11px;color:rgba(26,22,16,0.42);line-height:1.6;margin-top:0.5rem">
          🔒 This context is used only for your analysis and is never stored.
        </p>""", unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            if st.button("← Back", use_container_width=True, type="secondary"):
                st.session_state.form_step = 2
                st.rerun()
        with c2:
            if st.button("Analyze my week →", use_container_width=True):
                _run_analysis(fd)


def _run_analysis(fd: dict):
    with st.spinner("Running Elena's stress model…"):
        model = compute_verity_score(
            sleep_hours            = fd.get('sleep_hours', 7),
            homework_hours_nightly = fd.get('homework_hours', 2),
            extracurricular_hours  = fd.get('practice_hours', 0),
            screen_time_daily      = fd.get('screen_time', 3),
            social_stress          = fd.get('social_stress', 0),
            tests                  = fd.get('tests', ''),
            projects_due           = fd.get('projects_due', ''),
            assignments            = fd.get('assignments', 0),
        )

    with st.spinner("Generating your personalized narrative…"):
        narrative = get_narrative(model, fd)

    st.session_state.results = dict(model=model, narrative=narrative)
    go_to('results')


def page_results():
    r = st.session_state.results
    if not r:
        go_to('landing')
        return

    model     = r['model']
    narrative = r['narrative']
    score     = model['score']
    color     = score_color(score)
    label     = score_label(score)

    # Header
    st.markdown('<div class="gold-rule"><div style="width:20px;height:1px;background:#b87800"></div>Verity · Week Analysis</div>', unsafe_allow_html=True)

    # Gauge
    st.plotly_chart(gauge_figure(score), use_container_width=True, config=dict(displayModeBar=False))
    st.markdown(f'<p style="text-align:center;font-family:Fraunces,serif;font-size:1.5rem;color:{color};margin-top:-1rem">{label}</p>', unsafe_allow_html=True)

    # Headline
    st.markdown(f"""
    <div class="verity-card" style="text-align:center;border-left:3px solid {color};margin:1rem 0">
      <p style="font-family:Fraunces,serif;font-style:italic;font-size:1.1rem;color:#1a1610;line-height:1.6;margin:0">
        "{narrative.get('headline','')}"
      </p>
    </div>""", unsafe_allow_html=True)

    # Crisis resources
    if score >= 8:
        st.markdown("""
        <div style="background:rgba(192,57,43,0.06);border:1px solid rgba(192,57,43,0.20);border-radius:14px;padding:16px 20px;margin-bottom:14px">
          <p style="font-size:13px;font-weight:600;color:rgba(150,30,20,0.95);margin:0 0 8px">
            🤝 Your score is high — you don't have to carry this alone.
          </p>
          <p style="font-size:13px;color:rgba(26,22,16,0.70);margin:0 0 10px;line-height:1.6">
            Verity can help you understand your stress, but it's no substitute for real support.
            Free, confidential help is always available:
          </p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="background:rgba(255,255,255,0.7);border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong style="font-size:13px">Crisis Text Line</strong>
                <div style="font-size:11px;color:rgba(26,22,16,0.55)">Free · Confidential · 24/7</div>
              </div>
              <span style="font-family:Fraunces,serif;color:rgba(150,30,20,0.9);font-size:14px">Text HOME to 741741</span>
            </div>
            <div style="background:rgba(255,255,255,0.7);border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong style="font-size:13px">988 Suicide & Crisis Lifeline</strong>
                <div style="font-size:11px;color:rgba(26,22,16,0.55)">Free · Confidential · 24/7</div>
              </div>
              <span style="font-family:Fraunces,serif;color:rgba(150,30,20,0.9);font-size:14px">Call or text 988</span>
            </div>
          </div>
        </div>""", unsafe_allow_html=True)

    # Factor Analysis
    st.markdown('<h3 style="font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;color:rgba(26,22,16,0.55);margin-bottom:10px">Factor Analysis</h3>', unsafe_allow_html=True)
    sev_colors = dict(High="#c0392b", Medium="#b87800", Low="#0f7a60")

    for fac in model['factors']:
        c = sev_colors[fac['severity']]
        explanation = narrative.get('factor_explanations', {}).get(fac['name'], '')
        badge = f'<span class="badge-{fac["severity"].lower()}">{fac["severity"]}</span>'
        st.markdown(f"""
        <div class="verity-card" style="border-left:3px solid {c}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:Fraunces,serif;font-size:1.05rem;color:#1a1610">{fac['name']}</span>
            {badge}
          </div>
          {bar_html(fac['pct'], c)}
          <p style="font-size:13px;color:rgba(26,22,16,0.70);margin:0;line-height:1.6">{explanation}</p>
        </div>""", unsafe_allow_html=True)

    # Action Plan
    st.markdown('<h3 style="font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;color:rgba(26,22,16,0.55);margin:1rem 0 10px">Your Action Plan</h3>', unsafe_allow_html=True)
    teal = "#0f7a60"
    for i, step in enumerate(narrative.get('action_plan', []), 1):
        st.markdown(f"""
        <div class="verity-card" style="border-left:3px solid {teal}">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(15,122,96,0.1);
                        border:1px solid rgba(15,122,96,0.3);display:flex;align-items:center;
                        justify-content:center;flex-shrink:0;font-size:12px;font-weight:600;color:{teal}">{i}</div>
            <div>
              <p style="font-family:Fraunces,serif;font-size:1rem;color:#1a1610;margin:0 0 4px">{step.get('action','')}</p>
              <p style="font-size:12px;color:rgba(26,22,16,0.60);margin:0 0 6px;line-height:1.5">{step.get('rationale','')}</p>
              <span style="font-size:11px;color:{teal}">⏱ {step.get('timeframe','')}</span>
            </div>
          </div>
        </div>""", unsafe_allow_html=True)

    # Optimal note
    st.markdown(f"""
    <div style="background:#fffbf0;border:1px solid rgba(184,120,0,0.18);border-radius:12px;padding:14px 18px;margin-bottom:1rem">
      <p style="font-size:13px;color:rgba(80,50,0,0.95);margin:0;line-height:1.6">
        💡 <strong>Why not zero?</strong> {narrative.get('optimal_note','')}
      </p>
    </div>""", unsafe_allow_html=True)

    # Attribution
    st.markdown("""
    <p style="text-align:center;font-size:11px;color:rgba(26,22,16,0.38);margin-bottom:1rem">
      Score computed by Elena's stress prediction model · narrative by AI
    </p>""", unsafe_allow_html=True)

    # Reset
    col = st.columns([1,2,1])[1]
    with col:
        if st.button("← Check in again", use_container_width=True, type="secondary"):
            st.session_state.results = None
            go_to('landing')


def page_privacy():
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<h2 style="font-size:1.5rem">Privacy Policy</h2>', unsafe_allow_html=True)

    sections = [
        ("What Verity collects",
         "When you fill out the weekly check-in, your inputs are used only to compute your stress score. Nothing is saved to a database, server, or file. When you close the tab, everything is gone."),
        ("What we never collect",
         "Verity does not collect your name, email address, age, school, or location. We do not use cookies, analytics trackers, or advertising pixels. We do not share any data with schools, parents, or third parties — ever."),
        ("API usage",
         "To generate the personalized narrative, your anonymized stress data (score and factor summary, never your raw inputs) is sent to Anthropic's Claude API solely to produce text. Anthropic's data handling is governed by their privacy policy at anthropic.com."),
        ("Children's privacy (COPPA)",
         "Verity does not knowingly collect personal information from users of any age. Because no account is required and no data is stored, users under 13 can use Verity safely with parental supervision — nothing is retained."),
        ("Changes to this policy",
         "If this policy changes, the updated version will appear here. Our core commitment never changes: your data does not leave your session."),
    ]
    for title, body in sections:
        st.markdown(f"""
        <div class="verity-card">
          <p style="font-size:11px;font-weight:600;color:#b87800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px">{title}</p>
          <p style="font-size:13px;color:rgba(26,22,16,0.70);margin:0;line-height:1.7">{body}</p>
        </div>""", unsafe_allow_html=True)

    st.markdown('<p style="font-size:11px;color:rgba(26,22,16,0.40)">Last updated: June 2026 · Built by Elena for the Mott Million Dollar Challenge</p>', unsafe_allow_html=True)

    if st.button("← Back"):
        go_to('landing')


# ══════════════════════════════════════════════════════════════════════
#  ROUTER
# ══════════════════════════════════════════════════════════════════════

page = st.session_state.page

if page == 'age_gate':  page_age_gate()
elif page == 'under_13': page_under_13()
elif page == 'landing':  page_landing()
elif page == 'form':     page_form()
elif page == 'results':  page_results()
elif page == 'privacy':  page_privacy()

# Disclaimer footer (all pages except age gate)
if page not in ('age_gate', 'under_13'):
    st.markdown(DISCLAIMER_HTML, unsafe_allow_html=True)
    _, pc, _ = st.columns([2, 1, 2])
    with pc:
        if st.button("Privacy Policy", key="privacy_link", type="secondary", use_container_width=True):
            go_to('privacy')
