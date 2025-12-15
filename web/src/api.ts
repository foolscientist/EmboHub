import * as schema from "./schemas.js";
const API = "";

export function authHeader() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export type ModelId = string | number;
export type FileId = string | number;

/**
 * @name j
 * @param {string} method - The HTTP method to use in the request, e.g. GET, POST, PUT etc.
 * @param {string} path - The relative URL path for the API endpoint you want to call.
 * @param {Object} [body] - Optional data payload to send as JSON in the body of a POST or PUT request.
 *
 * @returns {Promise<Object>} A Promise that resolves with the response data from the server, if available.
 *
 * @throws Will throw an error if the fetch call fails (network errors etc), or if the server responds with an HTTP status code indicating an error occurred on the server side (4xx, 5xx). If a JSON response is expected but cannot be parsed from the server's response text, this will also throw an error.
 *
 */
export async function authFetch(
  method: string,
  path: string,
  body: any = null,
) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("parse json error" + e.message);
  }
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.hash = "#login";
    throw new Error((data && data.detail) || "Unauthorized");
  }
  if (!res.ok) throw new Error((data && data.detail) || String(res.status));
  return data;
}

async function f(path: string, fd: any) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { ...authHeader() },
    body: fd,
  });
  if (!res.ok) throw new Error(res.status.toString());
  return res.json();
}

const api = {
  register: (u: string, p: string) =>
    authFetch("POST", "/auth/register", { username: u, password: p }),
  login: (u: string, p: string) =>
    authFetch("POST", "/auth/login", { username: u, password: p }),
  me: () =>
    fetch(API + "/auth/me", { headers: authHeader() }).then((r) => r.json()),
  listModels(q?: string, tags?: string, sort?: string): Promise<any> {
    let qs = [];

    if (q) {
      qs.push(`query=${encodeURIComponent(q)}`);
    }
    if (tags) {
      qs.push(`tags=${encodeURIComponent(tags)}`);
    }
    if (sort) {
      qs.push(`sort=${encodeURIComponent(sort)}`);
    }

    const url = "/models" + (qs.length ? `?${qs.join("&")}` : "");

    return fetch(API + url).then((response) => response.json());
  },
  createModel: (p: any) => authFetch("POST", "/models", p),
  getModel: (id: ModelId) => fetch(API + `/models/${id}`).then((r) => r.json()),
  listModelFiles: (id: ModelId) =>
    fetch(API + `/models/${id}/files`).then((r) => r.json()),
  uploadModelFile: (id: ModelId, file: File) => {
    const fd = new FormData();
    fd.append("f", file);
    return f(`/models/${id}/upload`, fd);
  },
  downloadUrl: (fid: number) => API + `/files/${fid}/download`,
  health: () => fetch(API + "/system/health").then((r) => r.json()),
};

const app = document.getElementById("app");

export { api };

export function mount(html: string) {
  const w = document.createElement("div");
  w.className = "fade-enter";
  w.innerHTML = html;
  app.innerHTML = "";
  app.appendChild(w);
  requestAnimationFrame(() => (w.className = "fade-enter-active"));
}
