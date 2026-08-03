const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "ec_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path, params) {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "All") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.pathname + url.search;
}

export async function api(path, { method = "GET", body, params, auth = true, headers = {} } = {}) {
  const opts = {
    method,
    headers: { ...headers },
  };

  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, params), opts);
  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      res.statusText ||
      "Request failed";
    if (res.status === 401 && auth) {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(message, res.status, payload);
  }

  return payload;
}

export const get = (path, params, options) => api(path, { ...options, method: "GET", params });
export const post = (path, body, options) => api(path, { ...options, method: "POST", body });
export const put = (path, body, options) => api(path, { ...options, method: "PUT", body });
export const del = (path, body, options) => api(path, { ...options, method: "DELETE", body });

/** Upload a file via multipart/form-data. Do not set Content-Type manually. */
export async function uploadFile(file, folder = "misc") {
  const form = new FormData();
  form.append("file", file);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl("/uploads", { folder }), {
    method: "POST",
    headers,
    body: form,
  });

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      res.statusText ||
      "Upload failed";
    throw new ApiError(message, res.status, payload);
  }

  return payload;
}
