"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { BRAND_GRADIENT } from "@/lib/util";

/**
 * Route-level error boundary for the editor. Catches unexpected render errors
 * (e.g. from export/highlighting) so the app shows a recoverable fallback
 * instead of a blank white screen. Wraps the page but not the root layout.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging / any future reporting hook.
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen grid place-items-center bg-bg text-fg p-6">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-5 w-12 h-12 rounded-2xl"
          style={{ background: BRAND_GRADIENT }}
        />
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
          The editor hit an unexpected error. Your saved style is kept in this
          browser — try again, or reload if that doesn&apos;t help.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-muted/70 font-mono">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => unstable_retry()}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ background: BRAND_GRADIENT }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-panel-2 border border-border hover:border-border-hover text-fg transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
