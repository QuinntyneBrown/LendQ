import { useEffect, useState } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
}

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1280) return "tablet";
  return "desktop";
}

function toState(bp: Breakpoint): BreakpointState {
  return {
    isMobile: bp === "mobile",
    isTablet: bp === "tablet",
    isDesktop: bp === "desktop",
    breakpoint: bp,
  };
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() =>
    toState(getBreakpoint(window.innerWidth)),
  );

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");
    const mqDesktop = window.matchMedia("(min-width: 1280px)");

    function update() {
      if (mqMobile.matches) setState(toState("mobile"));
      else if (mqTablet.matches) setState(toState("tablet"));
      else if (mqDesktop.matches) setState(toState("desktop"));
    }

    mqMobile.addEventListener("change", update);
    mqTablet.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);

    return () => {
      mqMobile.removeEventListener("change", update);
      mqTablet.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
    };
  }, []);

  return state;
}
