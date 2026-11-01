import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + derived;
}
export function verifyPassword(password, stored) {
  const [salt, key] = String(stored || "").split(":");
  if (!salt || !key) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db().query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)", [userId, hashToken(token), expires]);
  return { token, expires };
}
export async function getUser(request) {
  const token = request.cookies.get("clipclaps_session")?.value;
  if (!token) return null;
  const result = await db().query("SELECT u.id,u.email,u.display_name,u.role,u.referral_code FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.is_active=true", [hashToken(token)]);
  return result.rows[0] || null;
}
export function sessionCookie(response, token, expires) {
  response.cookies.set("clipclaps_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
  return response;
}
export function clearSessionCookie(response) {
  response.cookies.set("clipclaps_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
  return response;
}
