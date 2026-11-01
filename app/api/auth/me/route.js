import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(request){try{const user=await getUser(request);return NextResponse.json({user});}catch{return NextResponse.json({user:null},{status:500});}}
