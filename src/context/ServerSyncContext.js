import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import syncServices from "../services/sync.services";
import { getApiErrorMessage } from "../utils/apiErrorMessage";
import { useNavigatorOnline } from "../hooks/useNavigatorOnline";
import { AUTO_SERVER_SYNC } from "../constant/config";

const POLL_MS = 2000;
const MAX_POLLS = 450;
const ONLINE_DEBOUNCE_MS = 3500;
const SESSION_START_DELAY_MS = 4000;

function collectionErrors(collections) {
  if (!Array.isArray(collections)) return [];
  return collections
    .filter((c) => c && c.status === "error" && c.lastError)
    .map((c) => `${c.collection}: ${c.lastError}`);
}

function isSyncBusy(status) {
  if (!status) return false;
  const pullRun = status.pull?.isRunning;
  const pushRun = status.push?.isRunning;
  return Boolean(pullRun || pushRun);
}

async function waitUntilSyncIdle(getStatus) {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    const { data } = await getStatus();
    if (!isSyncBusy(data)) return data;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error("Sync status polling timed out");
}

const ServerSyncContext = createContext(null);

function readHasToken() {
  try {
    return Boolean(localStorage.getItem("access_token"));
  } catch {
    return false;
  }
}

/**
 * Auto POST /sync/trigger when the browser goes online (debounced) and once after login,
 * for any authenticated user (admin panel or stall user panel). No manual button required.
 */
export function ServerSyncProvider({ children }) {
  const isOnline = useNavigatorOnline();
  const [hasToken, setHasToken] = useState(readHasToken);

  useEffect(() => {
    const syncTokenState = () => setHasToken(readHasToken());
    window.addEventListener("storage", syncTokenState);
    window.addEventListener("sahitya-access-token-changed", syncTokenState);
    return () => {
      window.removeEventListener("storage", syncTokenState);
      window.removeEventListener("sahitya-access-token-changed", syncTokenState);
    };
  }, []);

  const canSync = hasToken;

  const [lastStatus, setLastStatus] = useState(null);
  const [syncUiPhase, setSyncUiPhase] = useState("idle");
  const [lastCompletedAt, setLastCompletedAt] = useState(null);
  const [lastErrorSummary, setLastErrorSummary] = useState(null);

  const inFlightRef = useRef(false);
  const onlineTimerRef = useRef(null);
  const sessionBootRef = useRef(false);

  const runFullSync = useCallback(
    async ({ silent = false, manual = false } = {}) => {
      const token = localStorage.getItem("access_token");
      if (!token || !canSync) return null;
      if (!isOnline) {
        if (manual)
          toast.warn("You appear offline. Connect to the internet first.");
        return null;
      }
      if (inFlightRef.current) return null;

      inFlightRef.current = true;
      setSyncUiPhase("running");
      setLastErrorSummary(null);

      try {
        try {
          await syncServices.postSyncTrigger();
        } catch (err) {
          if (err.response?.status === 409) {
            /* another client or tab already started — keep polling */
          } else {
            throw err;
          }
        }

        const finalStatus = await waitUntilSyncIdle(syncServices.getSyncStatus);
        setLastStatus(finalStatus);

        const pullErrs = collectionErrors(finalStatus?.pull?.collections);
        const pushErrs = collectionErrors(finalStatus?.push?.collections);
        const allErrs = [...pullErrs, ...pushErrs];

        if (allErrs.length) {
          const msg = allErrs.slice(0, 4).join("; ");
          setLastErrorSummary(msg);
          if (manual || !silent) {
            toast.error(
              `Sync finished with server errors. Check CENTRAL_SERVER_URL / SYNC_API_KEY / BRANCH_CODE on the API. ${msg}`
            );
          }
        } else {
          setLastCompletedAt(new Date());
          if (manual) toast.success("Server sync completed (pull + push).");
        }

        setSyncUiPhase("idle");
        return finalStatus;
      } catch (err) {
        const message = getApiErrorMessage(err, "Sync request failed");
        setLastErrorSummary(message);
        setSyncUiPhase("error");
        if (manual || !silent) toast.error(message);
        return null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [canSync, isOnline]
  );

  useEffect(() => {
    if (!canSync) return;
    if (!isOnline) return;
    if (sessionBootRef.current) return;
    if (!AUTO_SERVER_SYNC) return;

    sessionBootRef.current = true;
    const t = window.setTimeout(() => {
      runFullSync({ silent: true, manual: false });
    }, SESSION_START_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [canSync, isOnline, runFullSync]);

  useEffect(() => {
    if (!canSync) return;
    if (!AUTO_SERVER_SYNC) return;

    const schedule = () => {
      if (onlineTimerRef.current) window.clearTimeout(onlineTimerRef.current);
      onlineTimerRef.current = window.setTimeout(() => {
        onlineTimerRef.current = null;
        if (navigator.onLine) runFullSync({ silent: true, manual: false });
      }, ONLINE_DEBOUNCE_MS);
    };

    const onOnline = () => schedule();
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      if (onlineTimerRef.current) window.clearTimeout(onlineTimerRef.current);
    };
  }, [canSync, runFullSync]);

  const refreshStatusOnly = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !canSync) return;
    try {
      const { data } = await syncServices.getSyncStatus();
      setLastStatus(data);
    } catch {
      /* ignore */
    }
  }, [canSync]);

  const triggerManual = useCallback(() => {
    return runFullSync({ silent: false, manual: true });
  }, [runFullSync]);

  const value = useMemo(
    () => ({
      isOnline,
      canSync,
      syncUiPhase,
      lastStatus,
      lastCompletedAt,
      lastErrorSummary,
      triggerManual,
      refreshStatusOnly,
    }),
    [
      isOnline,
      canSync,
      syncUiPhase,
      lastStatus,
      lastCompletedAt,
      lastErrorSummary,
      triggerManual,
      refreshStatusOnly,
    ]
  );

  return (
    <ServerSyncContext.Provider value={value}>{children}</ServerSyncContext.Provider>
  );
}

export function useServerSync() {
  const ctx = useContext(ServerSyncContext);
  if (!ctx) {
    return {
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      canSync: false,
      syncUiPhase: "idle",
      lastStatus: null,
      lastCompletedAt: null,
      lastErrorSummary: null,
      triggerManual: async () => null,
      refreshStatusOnly: async () => {},
    };
  }
  return ctx;
}
