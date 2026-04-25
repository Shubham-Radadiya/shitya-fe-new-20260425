/**
 * Extract a user-facing string from axios/fetch errors (server often sends `{ message }`).
 */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again."
) {
  if (!error) return fallback;

  const data = error.response?.data;
  const status = error.response?.status;

  if (data != null) {
    if (typeof data === "string" && data.trim()) return data.trim();
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      const part =
        typeof first === "string"
          ? first
          : first?.message || first?.msg || first?.path;
      if (part) return String(part);
    }
  }

  if (typeof error.message === "string" && error.message) {
    const m = error.message;
    if (!m.startsWith("Request failed with status code")) return m;
  }

  if (status === 401) {
    return "Session expired or unauthorized. Please sign in again.";
  }
  if (status === 403) {
    return "You are not allowed to perform this action.";
  }
  if (status === 404) return "Not found.";
  if (status >= 500) return "Server error. Try again later.";

  return fallback;
}
