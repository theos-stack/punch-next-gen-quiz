"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      setIsNavigating(false);
      if (clearTimer) clearTimeout(clearTimer);
    };
    const start = () => {
      setIsNavigating(true);
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(clear, 12_000);
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
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  return <div className={`navigation-progress ${isNavigating ? "is-active" : ""}`} aria-hidden="true"><span /></div>;
}
