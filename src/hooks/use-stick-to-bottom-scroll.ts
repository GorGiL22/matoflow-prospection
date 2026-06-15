"use client";

import { useEffect, useRef, type UIEvent } from "react";

const STICK_THRESHOLD_PX = 48;

export function useStickToBottomScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stickToBottomRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [dependency]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceFromBottom <= STICK_THRESHOLD_PX;
  }

  return { containerRef, handleScroll };
}
