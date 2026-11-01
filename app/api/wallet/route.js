import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 const [balance,ledger,unlock]=await Promise.all([
  db().query("SELECT COALESCE(sum(amount_coins),0)::int AS coins FROM wallet_ledger WHERE user_id=$1",[user.id]),
  db().query("SELECT entry_type,amount_coins,created_at FROM wallet_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",[user.id]),
  db().query("SELECT extra_videos_unlocked FROM user_unlocks WHERE user_id=$1",[user.id])
 ]);
 return NextResponse.json({balance:balance.rows[0].coins,ledger:ledger.rows,extraVideos:unlock.rows[0]?.extra_videos_unlocked||0,currency:"monedas demo",withdrawalsEnabled:false});
}
