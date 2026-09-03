export const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== "") {
    // Remove trailing slash to avoid double slashes
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "");
  }
  if (import.meta.env.PROD) {
    return "";
  }
  return "http://localhost:3000";
};

export const API_URL = getApiUrl();

console.log("[Noxus] API_URL:", API_URL || "(relative/same-origin)");
