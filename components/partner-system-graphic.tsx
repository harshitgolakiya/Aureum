export function PartnerSystemGraphic() {
  return (
    <div className="partner-system-graphic">
      <svg
        viewBox="0 0 900 560"
        role="img"
        aria-label="Three Aureum development pathways converging through one coordinated system"
      >
        <g>
          <text x="40" y="115" className="partner-system-path-number">01</text>
          <text x="72" y="115" className="partner-system-path-label">
            PREDICTIVE DEVELOPMENT
          </text>
          <path
            className="partner-system-main-path partner-system-draw partner-system-path-1"
            pathLength="1"
            d="M40 153 H148 C177 153 190 176 224 176 H286 C337 176 360 142 404 142 C447 142 472 165 491 196"
          />
        </g>

        <g>
          <text x="40" y="270" className="partner-system-path-number">02</text>
          <text x="72" y="270" className="partner-system-path-label">
            DEVELOPMENT MANAGEMENT
          </text>
          <path
            className="partner-system-main-path partner-system-draw partner-system-path-2"
            pathLength="1"
            d="M40 306 H158 C185 306 198 280 229 280 H382 C420 280 452 275 478 273"
          />
          <g className="partner-system-technical-lines">
            <path d="M92 237V323" />
            <path d="M136 237V323" />
            <path d="M180 237V323" />
            <path d="M65 251H202" />
            <path d="M65 309H202" />
          </g>
        </g>

        <g>
          <text x="40" y="430" className="partner-system-path-number">03</text>
          <text x="72" y="430" className="partner-system-path-label">
            STRATEGIC PARTNERSHIPS
          </text>
          <path
            className="partner-system-main-path partner-system-draw partner-system-path-3"
            pathLength="1"
            d="M40 468 H135 C161 468 178 433 207 433 H278 C335 433 370 394 412 382 C452 370 477 345 493 317"
          />
          <g className="partner-system-mini-network">
            <path d="M82 396 L124 430 L166 396 L82 396" />
            <circle cx="82" cy="396" r="5" />
            <circle cx="124" cy="430" r="5" />
            <circle cx="166" cy="396" r="5" />
          </g>
        </g>

        <g>
          <circle cx="520" cy="270" r="151" className="partner-system-orbit partner-system-orbit-outer" />
          <circle cx="520" cy="270" r="128" className="partner-system-orbit partner-system-orbit-middle" />
          <circle cx="520" cy="270" r="103" className="partner-system-orbit partner-system-orbit-inner" />

          <text x="520" y="87" textAnchor="middle" className="partner-system-discipline">
            COMMERCIAL
          </text>
          <line x1="520" y1="101" x2="520" y2="116" className="partner-system-discipline-line" />
          <path className="partner-system-discipline-arc" d="M445 199 A103 103 0 0 1 595 199" />

          <text x="332" y="360" className="partner-system-discipline">STRATEGIC</text>
          <line x1="382" y1="347" x2="397" y2="347" className="partner-system-discipline-line" />
          <text x="690" y="360" className="partner-system-discipline">TECHNICAL</text>
          <line x1="648" y1="347" x2="672" y2="347" className="partner-system-discipline-line" />

          <path
            className="partner-system-network-line partner-system-draw partner-system-network-animation"
            pathLength="1"
            d="M579 145 L643 224 L625 343 L562 406 L475 406 L405 342 L393 224 Z"
          />
          <path
            className="partner-system-network-secondary partner-system-draw partner-system-network-animation"
            pathLength="1"
            d="M579 145 L625 343 M643 224 L475 406 M393 224 L562 406"
          />

          <g className="partner-system-fade partner-system-f1">
            <circle cx="579" cy="145" r="6" className="partner-system-node" />
            <path d="M585 145H625" className="partner-system-leader" />
            <text x="636" y="149" className="partner-system-node-text">LAND</text>
          </g>
          <g className="partner-system-fade partner-system-f2">
            <circle cx="643" cy="224" r="6" className="partner-system-node" />
            <path d="M649 224H700" className="partner-system-leader" />
            <text x="711" y="228" className="partner-system-node-text">CAPITAL</text>
          </g>
          <g className="partner-system-fade partner-system-f3">
            <circle cx="625" cy="343" r="6" className="partner-system-node partner-system-node-gold" />
            <path d="M631 343H690" className="partner-system-leader" />
            <text x="701" y="347" className="partner-system-node-text">OCCUPIER</text>
          </g>
          <g className="partner-system-fade partner-system-f4">
            <circle cx="562" cy="406" r="6" className="partner-system-node" />
            <path d="M562 412 V438 H596" className="partner-system-leader" />
            <text x="607" y="442" className="partner-system-node-text">DESIGN</text>
          </g>
          <g className="partner-system-fade partner-system-f5">
            <circle cx="475" cy="406" r="6" className="partner-system-node" />
            <path d="M475 412 V438 H436" className="partner-system-leader" />
            <text x="424" y="442" textAnchor="end" className="partner-system-node-text">ENGINEERING</text>
          </g>
          <g className="partner-system-fade partner-system-f6">
            <circle cx="405" cy="342" r="6" className="partner-system-node partner-system-node-gold" />
            <path d="M399 342H349" className="partner-system-leader" />
            <text x="338" y="346" textAnchor="end" className="partner-system-node-text">DELIVERY</text>
          </g>

          <g className="partner-system-core">
            <circle cx="520" cy="270" r="69" className="partner-system-core-background" />
            <circle cx="520" cy="270" r="57" className="partner-system-core-ring" />
            <image
              href="/aureumLogo.svg"
              x="458"
              y="245"
              width="124"
              height="50"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          <path
            className="partner-system-output-line partner-system-draw partner-system-output-animation"
            pathLength="1"
            d="M589 270 H770"
          />
          <circle cx="770" cy="270" r="6" className="partner-system-output-dot partner-system-fade partner-system-f7" />
          <text x="680" y="245" className="partner-system-output-small">VALUE</text>
          <text x="680" y="258" className="partner-system-output-large">LONG-TERM PERFORMANCE</text>
        </g>
      </svg>
    </div>
  );
}
