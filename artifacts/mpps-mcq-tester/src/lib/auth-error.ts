/**
 * Maps a Firebase Auth error to a user-friendly message.
 * Always logs the full raw error to the browser console for debugging.
 */
export function friendlyAuthError(err: unknown, context = "auth"): string {
  // Always log the raw error so it's visible in browser DevTools / Netlify logs
  console.error(`[MPPS ${context}] Registration/login error:`, err);

  const code: string   = (err as any)?.code    ?? "";
  const msg: string    = (err as any)?.message  ?? "";
  const name: string   = (err as any)?.name     ?? "";

  // ── Firebase Auth errors ────────────────────────────────────────────────
  if (code === "auth/user-not-found"  ||
      code === "auth/wrong-password"  ||
      code === "auth/invalid-credential" ||
      code === "auth/invalid-login-credentials")
    return "Incorrect mobile number or password. Please check and try again.";

  if (code === "auth/email-already-in-use")
    return "This mobile number is already registered. Please login instead.";

  if (code === "auth/weak-password")
    return "Password is too weak. Please use at least 6 characters.";

  if (code === "auth/too-many-requests")
    return "Too many failed attempts. Please wait a few minutes and try again.";

  if (code === "auth/network-request-failed" || name === "FirebaseError" && msg.includes("network"))
    return "Network error. Please check your internet connection and try again.";

  if (code === "auth/user-disabled")
    return "This account has been disabled. Please contact your school.";

  if (code === "auth/requires-recent-login")
    return "Session expired. Please log out and sign in again.";

  if (code === "auth/invalid-email")
    return "Invalid login details. Please try again.";

  if (code === "auth/invalid-api-key" || code === "auth/app-not-authorized")
    return "Firebase is not configured correctly. Please contact school administration. (Error: invalid-api-key)";

  if (code === "auth/operation-not-allowed")
    return "Email/Password sign-in is not enabled in Firebase. Please contact school administration. (Error: operation-not-allowed)";

  if (code === "auth/configuration-not-found")
    return "Firebase project not found. Please contact school administration. (Error: configuration-not-found)";

  if (code === "auth/internal-error")
    return "Firebase internal error. Please try again. If this persists, contact administration.";

  if (code === "auth/popup-blocked")
    return "Popup was blocked by your browser. Please allow popups and try again.";

  if (code === "auth/popup-closed-by-user")
    return "Sign-in was cancelled. Please try again.";

  if (code === "auth/account-exists-with-different-credential")
    return "An account already exists with this mobile number using a different method.";

  // ── Firestore / storage errors ──────────────────────────────────────────
  if (code === "permission-denied"   || msg.includes("permission-denied")  ||
      code === "firestore/permission-denied")
    return "Database permission denied. Please contact school administration. (Error: permission-denied)";

  if (code === "unavailable" || msg.includes("unavailable"))
    return "Service temporarily unavailable. Please check your internet and try again.";

  // ── Fallback: always show the raw code so admins can diagnose ───────────
  const raw = code || msg || "unknown";
  return `Something went wrong (${raw}). Please try again or contact administration.`;
}
