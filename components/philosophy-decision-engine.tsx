export function PhilosophyDecisionEngine() {
  const verticals = [84, 164, 244, 324, 396, 476, 556, 636];
  const horizontals = [108, 176, 244, 312, 380, 448, 516, 584];

  return (
    <div className="philosophy-engine">
      <div className="philosophy-engine-status" aria-hidden="true">
        <span>Integrated decision framework</span>
        <i>System active</i>
      </div>
      <svg
        viewBox="0 0 720 660"
        role="img"
        aria-label="Commercial, technical and strategic perspectives converging into one Aureum decision system"
      >
        <defs>
          <radialGradient id="philosophy-core-glow">
            <stop offset="0" stopColor="#c4a456" stopOpacity="0.48" />
            <stop offset="0.48" stopColor="#c4a456" stopOpacity="0.12" />
            <stop offset="1" stopColor="#c4a456" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="philosophy-plane-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c4a456" stopOpacity="0.18" />
            <stop offset="1" stopColor="#c4a456" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="philosophy-plane-blue" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#91a3ba" stopOpacity="0.16" />
            <stop offset="1" stopColor="#91a3ba" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="philosophy-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c4a456" stopOpacity="0" />
            <stop offset="0.5" stopColor="#c4a456" stopOpacity="0.24" />
            <stop offset="1" stopColor="#c4a456" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="philosophy-engine-grid" aria-hidden="true">
          {verticals.map((x) => (
            <line x1={x} y1="64" x2="360" y2="602" key={`v-${x}`} />
          ))}
          {horizontals.map((y) => (
            <line x1="48" y1={y} x2="672" y2={y} key={`h-${y}`} />
          ))}
        </g>

        <g className="philosophy-engine-plane philosophy-engine-commercial">
          <polygon points="54,112 316,166 316,366 54,310" />
          <path d="M92 148 L280 188 L280 326 L92 286 Z" />
          <text x="76" y="92">COMMERCIAL</text>
          <text x="76" y="108" className="philosophy-engine-code">MARKET / VALUE / CAPITAL</text>
        </g>
        <g className="philosophy-engine-plane philosophy-engine-technical">
          <polygon points="666,112 404,166 404,366 666,310" />
          <path d="M628 148 L440 188 L440 326 L628 286 Z" />
          <text x="644" y="92" textAnchor="end">TECHNICAL</text>
          <text x="644" y="108" textAnchor="end" className="philosophy-engine-code">DESIGN / DELIVERY / RISK</text>
        </g>
        <g className="philosophy-engine-plane philosophy-engine-strategic">
          <polygon points="150,590 298,386 422,386 570,590" />
          <path d="M218 558 L320 414 L400 414 L502 558 Z" />
          <text x="360" y="622" textAnchor="middle">STRATEGIC</text>
          <text x="360" y="638" textAnchor="middle" className="philosophy-engine-code">POSITION / ALIGNMENT / PERFORMANCE</text>
        </g>

        <g className="philosophy-engine-connectors" aria-hidden="true">
          <path d="M124 214 C216 214 240 276 306 306" />
          <path d="M596 214 C504 214 480 276 414 306" />
          <path d="M360 548 C360 478 360 430 360 390" />
          <path d="M124 284 C222 356 260 364 316 352" />
          <path d="M596 284 C498 356 460 364 404 352" />
        </g>

        <g className="philosophy-engine-nodes" aria-hidden="true">
          {[
            [124, 214], [124, 284], [596, 214], [596, 284], [360, 548],
            [306, 306], [414, 306], [316, 352], [404, 352], [360, 390],
          ].map(([cx, cy], index) => (
            <circle cx={cx} cy={cy} r={index > 4 ? 4 : 5} key={`${cx}-${cy}`} />
          ))}
        </g>

        <g className="philosophy-engine-core" aria-hidden="true">
          <circle cx="360" cy="334" r="132" fill="url(#philosophy-core-glow)" />
          <circle cx="360" cy="334" r="102" className="philosophy-engine-ring philosophy-engine-ring-outer" />
          <circle cx="360" cy="334" r="78" className="philosophy-engine-ring philosophy-engine-ring-middle" />
          <circle cx="360" cy="334" r="54" className="philosophy-engine-ring philosophy-engine-ring-inner" />
          <path d="M360 280 L407 307 L407 361 L360 388 L313 361 L313 307 Z" className="philosophy-engine-aperture" />
          <line x1="274" y1="334" x2="446" y2="334" />
          <line x1="360" y1="248" x2="360" y2="420" />
          <text x="360" y="327" textAnchor="middle">ONE</text>
          <text x="360" y="347" textAnchor="middle">SYSTEM</text>
          <text x="360" y="365" textAnchor="middle" className="philosophy-engine-core-small">AUREUM</text>
        </g>

        <g className="philosophy-engine-output">
          <path d="M446 334 H638" />
          <circle cx="638" cy="334" r="5" />
          <text x="638" y="316" textAnchor="end">ALIGNED DECISION</text>
          <text x="638" y="358" textAnchor="end" className="philosophy-engine-output-strong">LONG-TERM VALUE</text>
        </g>

        <rect className="philosophy-engine-scan" x="36" y="72" width="648" height="72" fill="url(#philosophy-scan)" />
      </svg>
      <div className="philosophy-engine-readout" aria-hidden="true">
        <span><i /> Perspective aligned</span>
        <span>Commercial + Technical + Strategic</span>
        <strong>A</strong>
      </div>
    </div>
  );
}
