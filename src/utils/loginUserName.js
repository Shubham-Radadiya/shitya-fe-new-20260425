/** Login user name: short id like "admin" or "g.dave" — not an email. */
export const LOGIN_USER_NAME_PATTERN = /^[a-zA-Z0-9_.-]{2,32}$/;

export const loginUserNameHint =
  "2–32 characters: letters, numbers, underscore (_), hyphen (-), or dot (.). No email.";

export function isValidLoginUserName(value) {
  const v = String(value ?? "").trim();
  if (!v) return false;
  if (v.includes("@") || /\s/.test(v)) return false;
  return LOGIN_USER_NAME_PATTERN.test(v);
}

export function validateLoginUserNameMessage(value) {
  if (isValidLoginUserName(value)) return "";
  const v = String(value ?? "").trim();
  if (!v) return " * User name is required";
  if (v.includes("@") || /\s/.test(v)) {
    return " * Use a login name (e.g. admin), not an email address";
  }
  return ` * ${loginUserNameHint}`;
}
