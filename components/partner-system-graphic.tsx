const pathways = [
  { number: "01", label: "PREDICTIVE DEVELOPMENT", y: 92 },
  { number: "02", label: "DEVELOPMENT MANAGEMENT", y: 220 },
  { number: "03", label: "STRATEGIC DEVELOPMENT\nPARTNERSHIPS", y: 348 },
];

export function PartnerSystemGraphic() {
  return (
    <div className="partner-system-graphic">
      <svg
        viewBox="0 0 780 440"
        role="img"
        aria-label="Three development models guided by the Aureum System toward repeatable excellence"
      >
        <g className="partner-system-pathways">
          {pathways.map((pathway, index) => (
            <g
              className={`partner-system-pathway partner-system-pathway-${index + 1}`}
              key={pathway.number}
            >
              <rect x="20" y={pathway.y - 34} width="258" height="68" rx="2" />
              <text x="40" y={pathway.y + 4} className="partner-system-path-number">
                {pathway.number}
              </text>
              <text
                x="78"
                y={pathway.y - (index === 2 ? 5 : -4)}
                className="partner-system-path-label"
              >
                {pathway.label.split("\n").map((line, lineIndex) => (
                  <tspan x="78" dy={lineIndex === 0 ? 0 : 14} key={line}>
                    {line}
                  </tspan>
                ))}
              </text>
              <path
                className="partner-system-flow partner-system-draw"
                pathLength="1"
                d={`M278 ${pathway.y} C345 ${pathway.y} 352 220 405 220`}
              />
            </g>
          ))}
        </g>

        <g className="partner-system-core">
          <circle cx="480" cy="220" r="76" className="partner-system-core-background" />
          <circle cx="480" cy="220" r="65" className="partner-system-core-ring" />
          <text x="480" y="207" textAnchor="middle" className="partner-system-core-kicker">
            THE
          </text>
          <text x="480" y="226" textAnchor="middle" className="partner-system-core-name">
            AUREUM
          </text>
          <text x="480" y="244" textAnchor="middle" className="partner-system-core-kicker">
            SYSTEM
          </text>
        </g>

        <g className="partner-system-outcome partner-system-fade">
          <path
            className="partner-system-flow partner-system-draw partner-system-output-animation"
            pathLength="1"
            d="M556 220 H640"
          />
          <circle cx="640" cy="220" r="4" />
          <text x="662" y="211" className="partner-system-outcome-kicker">
            REPEATABLE
          </text>
          <text x="662" y="231" className="partner-system-outcome-label">
            EXCELLENCE
          </text>
        </g>

        <text x="20" y="420" className="partner-system-caption">
          THREE ENGAGEMENT MODELS · ONE DISCIPLINED FRAMEWORK
        </text>
      </svg>
    </div>
  );
}
