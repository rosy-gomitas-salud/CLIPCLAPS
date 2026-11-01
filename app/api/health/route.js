import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "ok", app: "CLIPCLAPS", mode: "demo", databaseConfigured: Boolean(process.env.DATABASE_URL) });
}
