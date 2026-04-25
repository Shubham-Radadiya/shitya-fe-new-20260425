/**
 * Branch for `/store-settings` and super-admin database backup (`?branchName=`).
 * Super admin Settings stall selector persists `sahitya_settings_branch`.
 * Everyone else uses `branchName` from login/session.
 */
export function resolveStoreSettingsBranchClient(branchOverride) {
  if (branchOverride != null && String(branchOverride).trim() !== "") {
    return String(branchOverride).trim().toUpperCase() || "KUD";
  }
  try {
    const role = localStorage.getItem("role");
    if (role === "SUPER ADMIN") {
      const st = localStorage.getItem("sahitya_settings_branch");
      if (st && String(st).trim()) {
        return String(st).trim().toUpperCase() || "KUD";
      }
    }
    const b = localStorage.getItem("branchName");
    return (b || "KUD").trim().toUpperCase() || "KUD";
  } catch {
    return "KUD";
  }
}
