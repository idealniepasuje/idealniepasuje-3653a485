import { useEffect, useCallback, useRef } from "react";

/**
 * Auto-logout after inactivity period.
 * @param onLogout - callback to execute on timeout
 * @param timeoutMs - inactivity timeout in ms (default 30 min)
 * @param enabled - whether the hook is active
 */
export const useInactivityLogout = (
  onLogout: () => void,
  timeoutMs: number = 30 * 60 * 1000,
  enabled: boolean = true
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLogoutRef.current();
    }, timeoutMs);
  }, [enabled, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, resetTimer]);
};
