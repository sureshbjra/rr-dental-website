"use client";

import { useEffect, useState } from "react";

/** Year is resolved after mount so static prerendering stays deterministic. */
export function CurrentYear({ fallback = 2026 }: { fallback?: number }) {
  const [year, setYear] = useState(fallback);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);
  return <>{year}</>;
}
