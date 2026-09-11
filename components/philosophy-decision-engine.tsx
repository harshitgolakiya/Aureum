export function PhilosophyDecisionEngine() {
  const font = "var(--font-sans), Arial, sans-serif";

  return (
    <div className="philosophy-engine philosophy-system-diagram">
      <svg
        viewBox="0 0 760 560"
        role="img"
        aria-label="The Aureum System connects Discipline, Integrated Thinking and Long-Term Perspective."
      >
        <defs>
          <radialGradient id="philosophy-system-center-disc" cx="34%" cy="24%" r="82%">
            <stop offset="0" stopColor="#263840" />
            <stop offset="1" stopColor="#0c161b" />
          </radialGradient>
          <filter id="philosophy-system-shadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#14202a" floodOpacity=".13" />
          </filter>
        </defs>

        <g className="philosophy-system-orbits" aria-hidden="true">
          <path
            className="philosophy-system-draw philosophy-system-outer-ring"
            pathLength="1"
            d="M380 72 L164 422 H596 Z"
          />
          <path
            className="philosophy-system-draw philosophy-system-connector"
            pathLength="1"
            d="M380 214 V158"
          />
          <path
            className="philosophy-system-draw philosophy-system-connector philosophy-system-connector-two"
            pathLength="1"
            d="M326 312 L209 397"
          />
          <path
            className="philosophy-system-draw philosophy-system-connector philosophy-system-connector-three"
            pathLength="1"
            d="M434 312 L551 397"
          />
          <circle className="philosophy-system-node" cx="380" cy="166" r="3" />
          <circle className="philosophy-system-node" cx="267" cy="355" r="3" />
          <circle className="philosophy-system-node" cx="493" cy="355" r="3" />
        </g>

        <g className="philosophy-system-pillar philosophy-system-discipline">
          <circle cx="380" cy="72" r="47" fill="#b88a2b" filter="url(#philosophy-system-shadow)" />
          <circle cx="380" cy="72" r="42" fill="none" stroke="#f1d58f" strokeOpacity=".48" strokeWidth=".8" />
          <g className="philosophy-system-icon" fill="none" stroke="#fff8e7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M380 51l17 6v13c0 11-6.5 19-17 24-10.5-5-17-13-17-24V57z" />
            <path d="M371 72l6 6 13-15" />
          </g>
          <text className="philosophy-system-heading" x="380" y="142" textAnchor="middle" fontFamily={font}>DISCIPLINE</text>
        </g>

        <g className="philosophy-system-pillar philosophy-system-integrated">
          <circle cx="164" cy="422" r="47" fill="#17483d" stroke="#b8d5cd" strokeWidth="1.5" filter="url(#philosophy-system-shadow)" />
          <circle cx="164" cy="422" r="42" fill="none" stroke="#dcebe6" strokeOpacity=".28" strokeWidth=".8" />
          <g className="philosophy-system-icon" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="164" y1="396" x2="149" y2="420" />
            <line x1="164" y1="396" x2="179" y2="420" />
            <line x1="149" y1="420" x2="164" y2="444" />
            <line x1="179" y1="420" x2="164" y2="444" />
            <circle cx="164" cy="396" r="5" fill="#17483d" />
            <circle cx="149" cy="420" r="5" fill="#17483d" />
            <circle cx="179" cy="420" r="5" fill="#17483d" />
            <circle cx="164" cy="444" r="5" fill="#17483d" />
          </g>
          <text className="philosophy-system-heading" x="164" y="501" textAnchor="middle" fontFamily={font}>INTEGRATED THINKING</text>
        </g>

        <g className="philosophy-system-pillar philosophy-system-longterm">
          <circle cx="596" cy="422" r="47" fill="#14283a" stroke="#bdc9d5" strokeWidth="1.5" filter="url(#philosophy-system-shadow)" />
          <circle cx="596" cy="422" r="42" fill="none" stroke="#e0e6eb" strokeOpacity=".26" strokeWidth=".8" />
          <g className="philosophy-system-icon" transform="translate(596 430) scale(.84) translate(-596 -422)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M595 426c-1-23 8-37 29-46-2 21-10 34-29 46z" />
            <path d="M595 426c-8-16-18-24-31-25 4 15 13 23 31 25z" />
            <path d="M595 426v17" />
          </g>
          <text className="philosophy-system-heading" x="596" y="501" textAnchor="middle" fontFamily={font}>LONG-TERM PERSPECTIVE</text>
        </g>

        <g className="philosophy-system-center" filter="url(#philosophy-system-shadow)">
          <circle cx="380" cy="280" r="68" fill="url(#philosophy-system-center-disc)" stroke="#c89b3c" strokeWidth="2" />
          <circle cx="380" cy="280" r="59" fill="none" stroke="#d7b55a" strokeOpacity=".35" strokeWidth=".8" />
          <g className="philosophy-system-icon" fill="none" stroke="#d5ae4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M380 236c-16 8-18 21 0 32 18-11 16-24 0-32z" />
            <path d="M380 236c16 8 18 21 0 32" />
            <path d="M380 236c-16 8-18 21 0 32" />
            <path d="M380 268v10" />
          </g>
          <g className="philosophy-system-center-label" textAnchor="middle" fontFamily={font}>
            <text x="380" y="300">THE AUREUM</text>
            <text x="380" y="317">SYSTEM</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
