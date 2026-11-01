import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const admin=await getUser(request);if(!admin||admin.role!=="admin")return NextResponse.json({error:"No autorizado."},{status:403});
 const q=await db().query("SELECT w.*,u.email,u.display_name FROM withdrawal_requests w JOIN users u ON u.id=w.user_id ORDER BY CASE WHEN w.status='pending' THEN 0 ELSE 1 END,w.created_at DESC LIMIT 200");
 return NextResponse.json({withdrawals:q.rows});
}
export async function PATCH(request){
 const admin=await getUser(request);if(!admin||admin.role!=="admin")return NextResponse.json({error:"No autorizado."},{status:403});
 const {withdrawalId,decision,note}=await request.json();
 if(!["approved","rejected","paid"].includes(decision))return NextResponse.json({error:"Estado inválido."},{status:400});
 const c=await db().connect();
 try{
  await c.query("BEGIN");
  const w=await c.query("SELECT * FROM withdrawal_requests WHERE id=$1 FOR UPDATE",[withdrawalId]);
  if(!w.rows.length){await c.query("ROLLBACK");return NextResponse.json({error:"Solicitud no encontrada."},{status:404});}
  const item=w.rows[0];
  if(decision==="paid"&&item.status!=="approved"){await c.query("ROLLBACK");return NextResponse.json({error:"Primero aprueba el retiro."},{status:409});}
  if(decision!=="paid"&&item.status!=="pending"){await c.query("ROLLBACK");return NextResponse.json({error:"La solicitud ya fue revisada."},{status:409});}
  if(decision==="paid"){
   await c.query("INSERT INTO cash_ledger(user_id,entry_type,amount_pennies,reference_id) VALUES($1,'withdrawal_debit',$2,$3)",[item.user_id,-item.amount_pennies,String(item.id)]);
  }
  await c.query("UPDATE withdrawal_requests SET status=$1,admin_note=$2,reviewed_by=$3,reviewed_at=now(),paid_at=CASE WHEN $1='paid' THEN now() ELSE paid_at END WHERE id=$4",[decision,String(note||"").slice(0,500),admin.id,item.id]);
  await c.query("COMMIT");return NextResponse.json({ok:true,status:decision});
 }catch(e){await c.query("ROLLBACK");console.error("admin withdrawal",e);return NextResponse.json({error:"No se pudo actualizar el retiro."},{status:500});}finally{c.release();}
}
