import { useState, useEffect } from "react";

/**
 * Browser online/offline from `navigator` + window events.
 * Note: `navigator.onLine` is a coarse signal (can be true while requests fail).
 */
export function useNavigatorOnline() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}
