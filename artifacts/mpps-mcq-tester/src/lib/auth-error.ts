export function friendlyAuthError(err: any): string {
  const code: string = err?.code ?? "";
  if (
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials"
  ) return "Incorrect User ID or Password. Please check your details and try again.";
  if (code === "auth/email-already-in-use")
    return "This mobile number is already registered. Please login instead.";
  if (code === "auth/weak-password")
    return "Password is too weak. Please use at least 6 characters.";
  if (code === "auth/too-many-requests")
    return "Too many failed attempts. Please wait a moment and try again.";
  if (code === "auth/network-request-failed")
    return "Internet connection problem. Please check your connection and try again.";
  if (code === "auth/user-disabled")
    return "This account has been disabled. Please contact your school.";
  if (code === "auth/requires-recent-login")
    return "Please log out and sign in again to continue.";
  if (code === "auth/invalid-email" || code === "auth/invalid-api-key")
    return "Invalid details. Please check and try again.";
  return "Something went wrong. Please try again.";
}
