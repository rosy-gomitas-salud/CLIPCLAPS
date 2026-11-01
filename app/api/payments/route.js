import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 const rows=await db().query("SELECT id,amount_pennies,provider,operation_number,status,created_at,admin_note FROM payment_requests WHERE user_id=$1 ORDER BY created_at DESC",[user.id]);
 return NextResponse.json({payments:rows.rows});
}
export async function POST(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 try{
  const form=await request.formData();const operation=String(form.get("operationNumber")||"").trim();
  const file=form.get("receipt");
  if(!/^[A-Za-z0-9-]{4,40}$/.test(operation))return NextResponse.json({error:"Ingresa un número de operación válido."},{status:400});
  if(!file||typeof file.arrayBuffer!=="function")return NextResponse.json({error:"Adjunta la constancia de pago."},{status:400});
  const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
  if(!allowed.includes(file.type)||file.size>4*1024*1024)return NextResponse.json({error:"Adjunta JPG, PNG, WEBP o PDF de máximo 4 MB."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  const result=await db().query("INSERT INTO payment_requests(user_id,operation_number,receipt_filename,receipt_mime,receipt_data) VALUES($1,$2,$3,$4,$5) RETURNING id,status,created_at",[user.id,operation,file.name.slice(0,180),file.type,bytes]);
  return NextResponse.json({payment:result.rows[0],message:"Solicitud enviada. El acceso se habilita únicamente después de la verificación manual."},{status:201});
 }catch(error){if(error.code==="23505")return NextResponse.json({error:"Ese número de operación ya fue utilizado."},{status:409});console.error("payment request",error);return NextResponse.json({error:"No se pudo enviar la constancia."},{status:500});}
}
