import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// AssistTI Sites: publicação controlada via Supabase Auth e permissões RLS.
const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";
const PUBLIC_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const GITHUB_TOKEN = Deno.env.get("GITHUB_PUBLISH_TOKEN") || "";
const ALLOWED_ORIGIN = "https://assistti.github.io";
const OWNER = "AssistTi";

type Result = { status: number; body: Record<string, unknown> };
function respond(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": ALLOWED_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "vary": "Origin",
    },
  });
}
async function sbGet(path: string, jwt: string) {
  const resp = await fetch(PROJECT_URL + "/rest/v1/" + path, {
    headers: {
      apikey: PUBLIC_KEY,
      Authorization: "Bearer " + jwt,
      Accept: "application/json",
    },
  });
  if (!resp.ok) throw new Error("Supabase REST " + resp.status);
  const data = await resp.json();
  if (!Array.isArray(data)) throw new Error("Formato inesperado do banco");
  return data;
}
async function github(path: string, method = "GET", data?: object) {
  const response = await fetch("https://api.github.com" + path, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + GITHUB_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "AssistTI-Sites-Publisher",
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error("GitHub " + response.status);
    (e as Error & { status?: number }).status = response.status;
    throw e;
  }
  return body;
}
function b64utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(result);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return respond(req, 200, { ok: true });
  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) return respond(req, 403, { error: "ORIGIN_NOT_ALLOWED" });
  if (req.method !== "POST") return respond(req, 405, { error: "METHOD_NOT_ALLOWED" });
  if (!PROJECT_URL || !PUBLIC_KEY) return respond(req, 503, { error: "SUPABASE_NOT_CONFIGURED" });

  const auth = req.headers.get("authorization") || "";
  const token = auth.match(/^Bearer ([-\w.]+)$/i)?.[1];
  if (!token) return respond(req, 401, { error: "SIGN_IN_REQUIRED" });

  let input: { action?: string; siteId?: string };
  try { input = await req.json(); }
  catch { return respond(req, 400, { error: "INVALID_JSON" }); }
  if (!/^[0-9a-f-]{36}$/i.test(input.siteId || "")) return respond(req, 400, { error: "INVALID_SITE" });

  try {
    const authResponse = await fetch(PROJECT_URL + "/auth/v1/user", {
      headers: { apikey: PUBLIC_KEY, Authorization: "Bearer " + token },
    });
    if (!authResponse.ok) return respond(req, 401, { error: "INVALID_SESSION" });
    const active = await authResponse.json();
    if (!active?.id) return respond(req, 401, { error: "INVALID_SESSION" });
    const uid = encodeURIComponent(active.id);
    const siteId = encodeURIComponent(input.siteId!);

    const [profiles, sites, access] = await Promise.all([
      sbGet("profiles?select=role&id=eq." + uid + "&limit=1", token),
      sbGet("sites?select=id,name,repository&id=eq." + siteId + "&limit=1", token),
      sbGet("site_access?select=can_edit,can_publish&user_id=eq." + uid +
            "&site_id=eq." + siteId + "&limit=1", token),
    ]);
    if (sites.length !== 1) return respond(req, 404, { error: "SITE_NOT_FOUND" });
    const allowed = profiles[0]?.role === "admin" ||
      (access[0]?.can_edit === true && access[0]?.can_publish === true);
    if (!allowed) return respond(req, 403, { error: "PUBLISH_NOT_ALLOWED" });
    if (!sites[0].repository || !/^AssistTi\/[a-zA-Z0-9._-]+$/i.test(sites[0].repository)) {
      return respond(req, 400, { error: "REPOSITORY_NOT_CONFIGURED" });
    }
    if (input.action === "status") {
      return respond(req, 200, { ok: true, configured: Boolean(GITHUB_TOKEN), canPublish: true });
    }
    if (input.action !== "publish") return respond(req, 400, { error: "UNKNOWN_ACTION" });
    if (!GITHUB_TOKEN) return respond(req, 503, { error: "GITHUB_SECRET_MISSING" });

    const docs = await sbGet(
      "site_documents?select=html,css&site_id=eq." + siteId + "&limit=1", token);
    if (!docs[0]?.html) return respond(req, 409, { error: "NO_SAVED_DRAFT" });

    const css = String(docs[0].css || "").replace(/<\/style/gi, "<\\/style");
    const doc = "<!doctype html>\n<html lang=\"pt-BR\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<title>" + String(sites[0].name || "Página").replace(/[<>&"]/g, "") + "</title>" +
      "<style>" + css + "</style></head><body>" + String(docs[0].html) + "</body></html>";
    const content = new TextEncoder().encode(doc);
    if (content.length > 9 * 1024 * 1024) {
      return respond(req, 413, { error: "PAGE_TOO_LARGE" });
    }

    const repo = String(sites[0].repository).split("/");
    const base = "/repos/" + encodeURIComponent(repo[0]) + "/" + encodeURIComponent(repo[1]);
    const info = await github(base);
    const branch = String(info.default_branch || "main");
    if (!/^[\w./-]+$/.test(branch) || branch.includes("..")) {
      return respond(req, 502, { error: "INVALID_BRANCH" });
    }

    const head = await github(base + "/git/ref/heads/" + branch);
    const sha = head?.object?.sha;
    if (!sha) return respond(req, 502, { error: "BRANCH_NOT_FOUND" });

    const filename = "/contents/index.html";
    const currentResponse = await fetch("https://api.github.com" + base + filename +
      "?ref=" + encodeURIComponent(branch), {
      headers: {
        Authorization: "Bearer " + GITHUB_TOKEN,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AssistTI-Sites-Publisher",
      },
    });
    if (currentResponse.status !== 200 && currentResponse.status !== 404) {
      return respond(req, 502, { error: "CANNOT_READ_SITE", status: currentResponse.status });
    }
    const oldIndex = currentResponse.ok ? await currentResponse.json() : null;
    const originalSha = oldIndex?.sha;

    // O backup preserva o estado inteiro da branch antes de cada publicação.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupBranch = "backup/assistti-sites/" + stamp + "-" + crypto.randomUUID().slice(0, 8);
    await github(base + "/git/refs", "POST", {
      ref: "refs/heads/" + backupBranch,
      sha,
    });
    const patch: Record<string, unknown> = {
      message: "Publicar via AssistTI Sites (" + active.id.slice(0, 8) + ")",
      content: b64utf8(doc),
      branch,
    };
    if (originalSha) patch.sha = originalSha;

    const saved = await github(base + filename, "PUT", patch);
    return respond(req, 200, {
      ok: true,
      commit: saved?.commit?.sha || null,
      backupBranch,
      repository: sites[0].repository,
      url: "https://" + repo[0].toLowerCase() + ".github.io/" + repo[1] + "/",
      note: "GitHub Pages atualizará após o build.",
    });
  } catch (error) {
    const ghStatus = (error as Error & { status?: number }).status;
    if (ghStatus) {
      return respond(req, ghStatus === 401 || ghStatus === 403 ? 503 : 502, {
        error: "GITHUB_PUBLISH_FAILED", githubStatus: ghStatus,
        message: "Não foi possível atualizar o repositório. Confira token, permissões e proteção da branch.",
      });
    }
    return respond(req, 500, { error: "INTERNAL_ERROR", message: "Falha ao validar ou publicar a página." });
  }
});