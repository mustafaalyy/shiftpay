const SESSION_KEY = "shiftpay.supabase.session";
const CLOUD_DISABLED_MESSAGE = "تسجيل الدخول السحابي غير مفعل في هذه النسخة.";

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

export function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function isSessionExpired(session) {
  if (!session?.expires_at) return false;
  return session.expires_at < Math.floor(Date.now() / 1000) + 60;
}

export async function signUpWithEmail({ email, password, companyName, phoneCountry, phone }) {
  const redirectTo = getRedirectUrl();
  const result = await authFetch(`/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    body: {
      email,
      password,
      data: {
        company_name: companyName,
        phone_country: phoneCountry,
        phone
      }
    }
  });

  if (result.access_token) storeSession(result);
  return result;
}

export async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  try {
    const result = await authFetch('/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    });
    if (result?.access_token) {
      const refreshed = { ...result, user: session.user };
      storeSession(refreshed);
      return refreshed;
    }
  } catch {
    // Refresh failed — session truly expired
  }
  return null;
}

export async function signInWithEmail({ email, password, persist = true }) {
  const result = await authFetch("/token?grant_type=password", {
    method: "POST",
    body: { email, password }
  });
  if (persist) storeSession(result);
  return result;
}

export function signInWithGoogle() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) throw new Error(CLOUD_DISABLED_MESSAGE);

  const redirectTo = getRedirectUrl();
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo
  });
  window.location.assign(`${config.url}/auth/v1/authorize?${params.toString()}`);
}

function getRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

export async function consumeOAuthSessionFromUrl() {
  if (!window.location.hash && !window.location.search) return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const error = hashParams.get("error_description") || queryParams.get("error_description");
  if (error) throw new Error(decodeURIComponent(error));

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (!accessToken) return null;

  const expiresIn = Number(hashParams.get("expires_in")) || 3600;
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: hashParams.get("token_type") || "bearer"
  };
  const user = await getCurrentUser(session);
  const sessionWithUser = { ...session, user };
  storeSession(sessionWithUser);
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
  return sessionWithUser;
}

export async function signOut(session) {
  if (session?.access_token) {
    await authFetch("/logout", {
      method: "POST",
      session
    });
  }
  storeSession(null);
}

export async function getCurrentUser(session) {
  if (!session?.access_token) return null;
  return authFetch("/user", { method: "GET", session });
}

export async function dbSelect(table, query = "", session) {
  return restFetch(`/${table}${query}`, { method: "GET", session });
}

export async function dbInsert(table, body, session) {
  return restFetch(`/${table}`, {
    method: "POST",
    body,
    session,
    prefer: "return=representation"
  });
}

export async function dbUpsert(table, body, session, onConflict = "id") {
  return restFetch(`/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    body,
    session,
    prefer: "resolution=merge-duplicates,return=representation"
  });
}

export async function dbUpdate(table, query, body, session) {
  return restFetch(`/${table}${query}`, {
    method: "PATCH",
    body,
    session,
    prefer: "return=representation"
  });
}

export async function dbDelete(table, query, session) {
  return restFetch(`/${table}${query}`, { method: "DELETE", session });
}

export function eq(column, value) {
  return `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`;
}

async function authFetch(path, { method, body, session } = {}) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) throw new Error(CLOUD_DISABLED_MESSAGE);

  const response = await fetch(`${config.url}/auth/v1${path}`, {
    method,
    headers: buildHeaders(config, session),
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

async function restFetch(path, { method, body, session, prefer } = {}) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) throw new Error(CLOUD_DISABLED_MESSAGE);

  const headers = buildHeaders(config, session);
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${config.url}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

export async function restFetchAnon(path, { method, body, prefer } = {}) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) throw new Error(CLOUD_DISABLED_MESSAGE);

  const headers = {
    apikey: config.anonKey,
    "Content-Type": "application/json"
  };
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${config.url}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

function buildHeaders(config, session) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${session?.access_token || config.anonKey}`,
    "Content-Type": "application/json"
  };
}

async function parseResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error;
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }
  return payload;
}
