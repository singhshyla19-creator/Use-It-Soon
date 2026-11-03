import { error, getSession, json, loadAppData } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return error("Account storage is not configured yet.", 503);
  const user = await getSession(request, env);
  if (!user) return error("You’re signed out.", 401);
  return json({ user: { email: user.email }, data: await loadAppData(env.DB, user.id) });
}
