import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request,{params}){
 const user=await getUser(request);if(!user||user.role!=="admin")return NextResponse.json({error:"No autorizado."},{status:403});
 const {id}=await params;
 const row=await db().query("SELECT receipt_data,receipt_mime,receipt_filename FROM payment_requests WHERE id=$1",[id]);
 if(!row.rows[0])return NextResponse.json({error:"Constancia no encontrada."},{status:404});
 return new NextResponse(row.rows[0].receipt_data,{headers:{"Content-Type":row.rows[0].receipt_mime,"Content-Disposition":'inline; filename="'+row.rows[0].receipt_filename.replace(/["\r\n]/g,"")+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
