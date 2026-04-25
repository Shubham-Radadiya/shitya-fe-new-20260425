/** **karelibaug-store** (web only). The stall Android app must not use this endpoint. */
export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3010";

/** If `"false"`, managers do not auto-call `POST /sync/trigger` on browser `online` / session load; header "Sync server" still works. */
export const AUTO_SERVER_SYNC =
  process.env.REACT_APP_AUTO_SERVER_SYNC !== "false";