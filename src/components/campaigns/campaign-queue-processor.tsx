"use client";

import { useEffect, useRef } from "react";

export function CampaignQueueProcessor() {
  const inFlightRef = useRef(false);

  useEffect(() => {
    function canProcessQueue() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return false;
      }
      if (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) {
        return false;
      }
      return true;
    }

    async function tick() {
      if (inFlightRef.current || !canProcessQueue()) return;
      inFlightRef.current = true;
      try {
        await fetch("/api/campaigns/process", { method: "POST" });
      } finally {
        inFlightRef.current = false;
      }
    }

    function handleResume() {
      void tick();
    }

    void tick();
    const interval = setInterval(() => void tick(), 10_000);
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("online", handleResume);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("online", handleResume);
    };
  }, []);

  return null;
}
