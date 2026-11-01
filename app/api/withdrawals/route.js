import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 const [b,p,h]=await Promise.all([
  db().query("SELECT COALESCE(sum(amount_pennies),0)::int AS balance FROM cash_ledger WHERE user_id=$1",[user.id]),
  db().query("SELECT COALESCE(sum(amount_pennies),0)::int AS reserved FROM withdrawal_requests WHERE user_id=$1 AND status IN ('pending','approved')",[user.id]),
  db().query("SELECT id,amount_pennies,bank_name,account_type,status,admin_note,created_at,reviewed_at,paid_at FROM withdrawal_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",[user.id])
 ]);
 return NextResponse.json({balancePennies:Math.max(0,b.rows[0].balance-p.rows[0].reserved),withdrawals:h.rows});
}
export async function POST(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 try{
  const x=await request.json();const amount=Math.round(Number(x.amount)*100);
  const fullName=String(x.fullName||"").trim(),doc=String(x.documentNumber||"").replace(/\\D/g,""),bank=String(x.bankName||"").trim(),type=String(x.accountType||"").trim(),account=String(x.accountNumber||"").replace(/\\s/g,""),cci=String(x.cci||"").replace(/\\s/g,""),phone=String(x.phone||"").trim();
  if(!Number.isInteger(amount)||amount<1000||amount>1000000)return NextResponse.json({error:"El retiro mínimo es S/10 y el máximo por solicitud es S/10,000."},{status:400});
  if(fullName.length<5||doc.length<8||doc.length>12||bank.length<2||!["Ahorros","Corriente"].includes(type)||account.length<8||account.length>24||(cci&&(!/^\\d{20}$/.test(cci))))return NextResponse.json({error:"Revisa tus datos bancarios. El CCI debe tener 20 dígitos."},{status:400});
  const c=await db().connect();
  try{
   await c.query("BEGIN");
   await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",[String(user.id)]);
   const bal=await c.query("SELECT COALESCE(sum(amount_pennies),0)::int AS balance FROM cash_ledger WHERE user_id=$1",[user.id]);
   if(bal.rows[0].balance<amount){await c.query("ROLLBACK");return NextResponse.json({error:"Tu saldo disponible en soles no alcanza para este retiro."},{status:400});}
   const pending=await c.query("SELECT COALESCE(sum(amount_pennies),0)::int AS amount FROM withdrawal_requests WHERE user_id=$1 AND status IN ('pending','approved')",[user.id]);
   if(bal.rows[0].balance-pending.rows[0].amount<amount){await c.query("ROLLBACK");return NextResponse.json({error:"Ya tienes retiros pendientes que reservan parte de tu saldo."},{status:409});}
   const ins=await c.query("INSERT INTO withdrawal_requests(user_id,amount_pennies,full_name,document_number,bank_name,account_type,account_number,cci,phone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,status,created_at",[user.id,amount,fullName,doc,bank,type,account,cci||null,phone||null]);
   await c.query("COMMIT");return NextResponse.json({withdrawal:ins.rows[0]}, {status:201});
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
 }catch(e){console.error("withdrawal request",e);return NextResponse.json({error:"No se pudo registrar el retiro."},{status:500});}
}
