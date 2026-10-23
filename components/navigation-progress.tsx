"use client";

import { usePathname } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import { navigationProgressReducer } from "@/lib/student/navigation-progress.mjs";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, dispatch] = useReducer(navigationProgressReducer, false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const clear = () => {
      dispatch("failed");
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = undefined;
    };
    const start = () => {
      dispatch("start");
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(clear, 12_000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>(".dashboard-wrap a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      start();
    };
    const onPopState = () => start();
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  useEffect(() => {
    dispatch("complete");
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = undefined;
  }, [pathname]);

  return <div className={`navigation-progress ${isNavigating ? "is-active" : ""}`} aria-hidden="true"><span /></div>;
}
