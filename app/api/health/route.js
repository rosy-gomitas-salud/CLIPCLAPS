import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    await db().query("SELECT 1");
    return NextResponse.json({ status: "ok", app: "CLIPCLAPS", mode: "production-demo", databaseConfigured: true, databaseConnected: true });
  } catch {
    return NextResponse.json({ status: "degraded", app: "CLIPCLAPS", databaseConfigured: Boolean(process.env.DATABASE_URL), databaseConnected: false }, { status: 503 });
  }
}
