function normalizeApiBase(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "/api";
  }

  const cleaned = raw.replace(/\/$/, "");

  if (cleaned === "/api" || cleaned.endsWith("/api")) {
    return cleaned;
  }

  // Render Blueprints can reference a backend service URL directly.
  // If we receive an absolute origin here, route API calls through `/api`.
  if (/^https?:\/\//i.test(cleaned)) {
    return `${cleaned}/api`;
  }

  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || "/api");
