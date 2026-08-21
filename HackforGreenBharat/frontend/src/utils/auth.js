/**
 * Returns the JWT token stored in localStorage (set at login).
 * Used to send Authorization: Bearer <token> on protected API calls.
 */
export const getToken = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const token = user?.token || user?.accessToken || null;
    return token && token !== "null" && token !== "undefined" ? token : null;
  } catch {
    return null;
  }
};

/**
 * Returns headers object with Authorization Bearer token.
 * Use with fetch: fetch(url, { headers: getAuthHeaders() })
 * Or spread with extra headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
