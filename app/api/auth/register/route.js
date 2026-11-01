import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, sessionCookie } from "@/lib/auth";
import { randomBytes } from "node:crypto";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    const { email, password, displayName, referralCode } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const name = String(displayName || "").trim().slice(0,60);
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || String(password || "").length < 10 || !name) return NextResponse.json({error:"Ingresa un nombre, correo válido y contraseña de al menos 10 caracteres."},{status:400});
    const referral = referralCode ? await db().query("SELECT id FROM users WHERE referral_code=$1 AND is_active=true",[String(referralCode).trim().toUpperCase()]) : {rows:[]};
    const code = "CLIP" + randomBytes(5).toString("hex").toUpperCase();
    const created = await db().query("INSERT INTO users(email,password_hash,display_name,referral_code,referred_by) VALUES($1,$2,$3,$4,$5) RETURNING id,email,display_name,role,referral_code", [cleanEmail,hashPassword(password),name,code,referral.rows[0]?.id || null]);
    if (referral.rows[0] && referral.rows[0].id !== created.rows[0].id) await db().query("INSERT INTO wallet_ledger(user_id,entry_type,amount_coins,reference_id) VALUES($1,'referral_reward',10,$2) ON CONFLICT DO NOTHING",[referral.rows[0].id,created.rows[0].id]);
    const session = await createSession(created.rows[0].id);
    return sessionCookie(NextResponse.json({user:created.rows[0]}),session.token,session.expires);
  } catch (error) {
    if (error.code === "23505") return NextResponse.json({error:"Este correo ya está registrado."},{status:409});
    console.error("register",error); return NextResponse.json({error:"No se pudo crear la cuenta."},{status:500});
  }
}
