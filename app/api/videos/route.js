import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){
 const user=await getUser(request); if(!user)return NextResponse.json({error:"Inicia sesión para continuar."},{status:401});
 const q=await db().query("SELECT v.id,v.title,v.creator,v.video_url AS src,v.category,v.reward_coins,EXISTS(SELECT 1 FROM video_views w WHERE w.user_id=$1 AND w.video_id=v.id) AS claimed FROM videos v WHERE v.is_active=true ORDER BY v.id LIMIT 100",[user.id]);
 const state=await db().query("SELECT count(*)::int AS watched FROM video_views WHERE user_id=$1",[user.id]);
 const unlock=await db().query("SELECT extra_videos_unlocked FROM user_unlocks WHERE user_id=$1",[user.id]);
 return NextResponse.json({videos:q.rows,watched:state.rows[0].watched,limit:3+(unlock.rows[0]?.extra_videos_unlocked||0),mode:"demo"});
}
export async function POST(request){
 const user=await getUser(request);if(!user)return NextResponse.json({error:"Inicia sesión."},{status:401});
 try{
  const {videoId}=await request.json();
  const unlock=await db().query("SELECT extra_videos_unlocked FROM user_unlocks WHERE user_id=$1",[user.id]);
  const watched=await db().query("SELECT count(*)::int AS n FROM video_views WHERE user_id=$1",[user.id]);
  const limit=3+(unlock.rows[0]?.extra_videos_unlocked||0);
  if(watched.rows[0].n>=limit)return NextResponse.json({error:"Has alcanzado tu límite de videos. Desbloquea el siguiente paquete."},{status:403});
  const video=await db().query("SELECT id,reward_coins FROM videos WHERE id=$1 AND is_active=true",[videoId]);
  if(!video.rows[0])return NextResponse.json({error:"Video no disponible."},{status:404});
  const inserted=await db().query("INSERT INTO video_views(user_id,video_id) VALUES($1,$2) ON CONFLICT(user_id,video_id) DO NOTHING RETURNING id",[user.id,videoId]);
  if(!inserted.rows.length)return NextResponse.json({error:"Ya reclamaste este video."},{status:409});
  await db().query("INSERT INTO wallet_ledger(user_id,entry_type,amount_coins,reference_id) VALUES($1,'video_reward',$2,$3)",[user.id,video.rows[0].reward_coins,String(videoId)]);
  const balance=await db().query("SELECT COALESCE(sum(amount_coins),0)::int AS coins FROM wallet_ledger WHERE user_id=$1",[user.id]);
  return NextResponse.json({ok:true,balance:balance.rows[0].coins,mode:"demo"});
 }catch(error){console.error("video claim",error);return NextResponse.json({error:"No se pudo registrar la recompensa."},{status:500});}
}
