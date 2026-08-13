"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="status-page error-state">
      <div className="status-field" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="status-number">360°</div>
      <div className="status-copy">
        <p className="eyebrow">
          <span /> Development interrupted
        </p>
        <h1>The pathway needs to be recalibrated.</h1>
        <p>
          An unexpected issue interrupted this page. Your position is safe and
          the experience can be restarted.
        </p>
        <button className="button" type="button" onClick={() => reset()}>
          Try again <span>↗</span>
        </button>
      </div>
    </main>
  );
}
