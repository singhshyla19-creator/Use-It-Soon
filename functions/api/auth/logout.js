import { error, isSameOrigin, json, removeSession, sessionCookieExpired } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("Account storage is not configured yet.", 503);
  if (!isSameOrigin(request)) return error("This request could not be verified.", 403);
  await removeSession(request, env);
  return json({ ok: true }, 200, { "set-cookie": sessionCookieExpired() });
}
