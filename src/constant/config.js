/** **karelibaug-store** (web only). The stall Android app must not use this endpoint. */
export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3010";

/** Sync API: when online, prefer this live base URL (falls back to `API_URL`). */
export const SYNC_LIVE_API_URL =
  process.env.REACT_APP_SYNC_LIVE_API_URL || API_URL;

/** Sync API: when offline, prefer this local/LAN base URL (falls back to localhost). */
export const SYNC_LOCAL_API_URL =
  process.env.REACT_APP_SYNC_LOCAL_API_URL || "http://localhost:3010";

/** If `"false"`, managers do not auto-call `POST /sync/trigger` on browser `online` / session load; header "Sync server" still works. */
export const AUTO_SERVER_SYNC =
  process.env.REACT_APP_AUTO_SERVER_SYNC !== "false";