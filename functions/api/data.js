import { error, getSession, json, readJson, saveAppData } from "../_lib/auth.js";

export async function onRequestPut({ request, env }) {
  if (!env.DB) return error("Account storage is not configured yet.", 503);
  if (!new URL(request.url).protocol.startsWith("https:") || request.headers.get("Origin") !== new URL(request.url).origin) return error("This request could not be verified.", 403);
  const user = await getSession(request, env);
  if (!user) return error("You’re signed out.", 401);
  const body = await readJson(request);
  if (body.error) return error(body.error);
  try { const data = await saveAppData(env.DB, user.id, body.data); return json({ ok: true, data }); }
  catch { return error("Your changes couldn’t be saved. Please try again.", 400); }
}
