import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const user=await getUser(request);if(!user||user.role!=="admin")return NextResponse.json({error:"No autorizado."},{status:403});
 const rows=await db().query("SELECT p.id,p.user_id,u.email,u.display_name,p.amount_pennies,p.operation_number,p.receipt_filename,p.receipt_mime,p.status,p.admin_note,p.created_at,p.reviewed_at FROM payment_requests p JOIN users u ON u.id=p.user_id ORDER BY CASE WHEN p.status='pending' THEN 0 ELSE 1 END,p.created_at DESC LIMIT 200");
 return NextResponse.json({payments:rows.rows});
}
export async function PATCH(request){
 const admin=await getUser(request);if(!admin||admin.role!=="admin")return NextResponse.json({error:"No autorizado."},{status:403});
 const {paymentId,decision,note}=await request.json();
 if(!["approved","rejected"].includes(decision))return NextResponse.json({error:"Decisión inválida."},{status:400});
 const client=await db().connect();
 try{
  await client.query("BEGIN");
  const updated=await client.query("UPDATE payment_requests SET status=$1,admin_note=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4 AND status='pending' RETURNING user_id",[decision,String(note||"").slice(0,500),admin.id,paymentId]);
  if(!updated.rows.length){await client.query("ROLLBACK");return NextResponse.json({error:"La solicitud ya fue revisada o no existe."},{status:409});}
  if(decision==="approved"){
   await client.query("INSERT INTO user_unlocks(user_id,extra_videos_unlocked) VALUES($1,3) ON CONFLICT(user_id) DO UPDATE SET extra_videos_unlocked=user_unlocks.extra_videos_unlocked+3,updated_at=now()",[updated.rows[0].user_id]);
  }
  await client.query("COMMIT");
  return NextResponse.json({ok:true,status:decision,unlockedVideos:decision==="approved"?3:0});
 }catch(error){await client.query("ROLLBACK");console.error("admin payment review",error);return NextResponse.json({error:"No se pudo revisar el pago."},{status:500});}finally{client.release();}
}
