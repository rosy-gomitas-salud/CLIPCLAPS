import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken, clearSessionCookie } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(request){const token=request.cookies.get("clipclaps_session")?.value;if(token)await db().query("DELETE FROM sessions WHERE token_hash=$1",[hashToken(token)]);return clearSessionCookie(NextResponse.json({ok:true}));}
