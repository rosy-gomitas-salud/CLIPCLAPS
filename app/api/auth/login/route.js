import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, sessionCookie } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    const {email,password}=await request.json();
    const result=await db().query("SELECT id,email,display_name,role,referral_code,password_hash FROM users WHERE email=$1 AND is_active=true",[String(email||"").trim().toLowerCase()]);
    const user=result.rows[0];
    if(!user || !verifyPassword(String(password||""),user.password_hash)) return NextResponse.json({error:"Correo o contraseña incorrectos."},{status:401});
    const session=await createSession(user.id); delete user.password_hash;
    return sessionCookie(NextResponse.json({user}),session.token,session.expires);
  } catch(error){console.error("login",error);return NextResponse.json({error:"No se pudo iniciar sesión."},{status:500});}
}
