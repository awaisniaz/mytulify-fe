"use client";

import { Suspense } from "react";
import { AuthCallbackInner } from "./AuthCallbackInner";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted">Completing sign in…</div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
