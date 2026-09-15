import { phases } from "@/data/site";

const phaseRows = [48, 132, 216, 300, 384, 468];
const developmentPhases = phases.map(([number, label], index) => ({
  number,
  label: label.toUpperCase(),
  y: phaseRows[index],
}));

export function PartnerSystemGraphic() {
  return (
    <div className="partner-system-graphic">
      <svg
        viewBox="0 0 780 540"
        role="img"
        aria-label="Six development phases guided by the Aureum System toward repeatable excellence"
      >
        <g className="partner-system-pathways">
          {developmentPhases.map((phase, index) => (
            <g
              className={`partner-system-pathway partner-system-pathway-${index + 1}`}
              key={phase.number}
            >
              <rect x="20" y={phase.y - 27} width="282" height="54" rx="2" />
              <text x="40" y={phase.y + 4} className="partner-system-path-number">
                {phase.number}
              </text>
              <text
                x="78"
                y={phase.y + 4}
                className="partner-system-path-label"
              >
                {phase.label}
              </text>
              <path
                className="partner-system-flow partner-system-draw"
                pathLength="1"
                d={`M302 ${phase.y} C350 ${phase.y} 362 258 405 258`}
              />
            </g>
          ))}
        </g>

        <g className="partner-system-core">
          <circle cx="480" cy="258" r="76" className="partner-system-core-background" />
          <circle cx="480" cy="258" r="65" className="partner-system-core-ring" />
          <text x="480" y="245" textAnchor="middle" className="partner-system-core-kicker">
            THE
          </text>
          <text x="480" y="264" textAnchor="middle" className="partner-system-core-name">
            AUREUM
          </text>
          <text x="480" y="282" textAnchor="middle" className="partner-system-core-kicker">
            SYSTEM
          </text>
        </g>

        <g className="partner-system-outcome partner-system-fade">
          <path
            className="partner-system-flow partner-system-draw partner-system-output-animation"
            pathLength="1"
            d="M556 258 H640"
          />
          <circle cx="640" cy="258" r="4" />
          <text x="662" y="249" className="partner-system-outcome-kicker">
            REPEATABLE
          </text>
          <text x="662" y="269" className="partner-system-outcome-label">
            EXCELLENCE
          </text>
        </g>

        <text x="20" y="528" className="partner-system-caption">
          SIX DEVELOPMENT PHASES · ONE INTEGRATED SYSTEM
        </text>
      </svg>
    </div>
  );
}
