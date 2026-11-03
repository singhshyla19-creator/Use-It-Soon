import { constantTimeEqual, error, hashPassword, issueSession, json, loadAppData, normalizeEmail, passwordError, readJson, validEmail } from "../../_lib/auth.js";

const DUMMY_SALT = "bG9naW4tdGltZS1zYWx0";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("Account storage is not configured yet.", 503);
  if (!new URL(request.url).protocol.startsWith("https:") || request.headers.get("Origin") !== new URL(request.url).origin) return error("This request could not be verified.", 403);
  const body = await readJson(request);
  if (body.error) return error(body.error);
  const email = normalizeEmail(body.email);
  if (!validEmail(email) || passwordError(body.password)) return error("Email or password is incorrect.", 401);
  const user = await env.DB.prepare("SELECT id, email, password_hash, salt FROM users WHERE email = ?").bind(email).first();
  const computed = await hashPassword(body.password, user?.salt || DUMMY_SALT);
  if (!user || !constantTimeEqual(computed, user.password_hash)) return error("Email or password is incorrect.", 401);
  const cookie = await issueSession(env.DB, user.id);
  const data = await loadAppData(env.DB, user.id);
  return json({ user: { email: user.email }, data }, 200, { "set-cookie": cookie });
}
