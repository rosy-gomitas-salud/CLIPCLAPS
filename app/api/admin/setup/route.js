import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, sessionCookie } from "@/lib/auth";
import { randomBytes, timingSafeEqual } from "node:crypto";
export const runtime="nodejs";
export async function POST(request){
 try{
  const {setupKey,email,password,displayName}=await request.json();
  const expected=Buffer.from(process.env.ADMIN_SETUP_KEY||"");const supplied=Buffer.from(String(setupKey||""));
  if(!expected.length||expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return NextResponse.json({error:"Clave de configuración incorrecta."},{status:403});
  const count=await db().query("SELECT count(*)::int AS n FROM users WHERE role='admin'");
  if(count.rows[0].n>0)return NextResponse.json({error:"El administrador inicial ya fue creado."},{status:409});
  const cleanEmail=String(email||"").trim().toLowerCase(),name=String(displayName||"Administrador").trim().slice(0,60);
  if(!/^\S+@\S+\.\S+$/.test(cleanEmail)||String(password||"").length<12)return NextResponse.json({error:"Usa un correo válido y una contraseña de al menos 12 caracteres."},{status:400});
  const code="ADMIN"+randomBytes(5).toString("hex").toUpperCase();
  const result=await db().query("INSERT INTO users(email,password_hash,display_name,role,referral_code) VALUES($1,$2,$3,'admin',$4) RETURNING id,email,display_name,role,referral_code",[cleanEmail,hashPassword(password),name,code]);
  const session=await createSession(result.rows[0].id);
  return sessionCookie(NextResponse.json({user:result.rows[0]}),session.token,session.expires);
 }catch(error){if(error.code==="23505")return NextResponse.json({error:"El correo ya existe."},{status:409});console.error("admin setup",error);return NextResponse.json({error:"No se pudo configurar el administrador."},{status:500});}
}
