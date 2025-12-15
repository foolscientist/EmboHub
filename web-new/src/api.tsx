const API = "";

import { type LegacyModelOut, type ModelInfo } from "@/types/model";

type ModelId = number | string;

export function authHeader(): HeadersInit {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

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
  } catch (ex) {
    const e = ex as Error;
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

interface LoginOut {
  access_token: string;
}

export async function login(u: string, p: string) {
  const res = await authFetch("POST", "/auth/login", {
    username: u,
    password: p,
  });
  return res as LoginOut;
}

export async function legacyListModels(
  q?: string,
  tags?: string,
  sort?: string,
): Promise<LegacyModelOut[]> {
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

  const f = await fetch(API + url);
  const j = await f.json();
  return j as LegacyModelOut[];
}

export async function listModels(
  q?: string,
  tags?: string,
  sort?: string,
): Promise<ModelInfo[]> {
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

  const f = await fetch(API + url);
  const j = await f.json();
  return j as ModelInfo[];
}

export async function getModel(id: ModelId) {
  const res = await fetch(API + `/models/${id}`);
  const j = await res.json();
  return j as ModelInfo;
}

export interface ModelFileEntry {
  id: string;
  filename: string;
  size: number;
}

export async function listModelFiles(id: ModelId) {
  const res = await fetch(API + `/models/${id}`);
  const j = await res.json();
  return j as ModelFileEntry[];
}

export function downloadUrl(fid: number | string) {
  return API + `/files/${fid}/download`;
}
