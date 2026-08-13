import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-field" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="status-number">404</div>
      <div className="status-copy">
        <p className="eyebrow">
          <span /> Outside the development field
        </p>
        <h1>This coordinate does not exist.</h1>
        <p>
          The page may have moved, or the address may be incomplete. Return to
          Aureum or continue through our developments.
        </p>
        <div>
          <Link className="button" href="/">
            Return home <span>↗</span>
          </Link>
          <Link className="text-link" href="/portfolio">
            Explore portfolio
          </Link>
        </div>
      </div>
    </main>
  );
}
