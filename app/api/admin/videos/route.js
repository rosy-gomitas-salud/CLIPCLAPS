import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const bucket = process.env.CLIPCLAPS_VIDEO_BUCKET;
function storage() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_ENDPOINT_URL_S3 || !bucket) throw new Error("Almacenamiento de videos no configurado.");
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
  });
}
const publicUrl = (key) => `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
export async function GET(request) {
  const user = await getUser(request);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const result = await db().query("SELECT id,title,description,creator,video_url,thumbnail_url,category,reward_coins,is_active,created_at FROM videos ORDER BY created_at DESC LIMIT 200");
  return NextResponse.json({ videos: result.rows });
}
export async function POST(request) {
  const user = await getUser(request);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("video");
    const title = String(form.get("title") || "").trim().slice(0, 120);
    const description = String(form.get("description") || "").trim().slice(0, 500);
    const creator = String(form.get("creator") || "@clipclaps").trim().slice(0, 60);
    const category = String(form.get("category") || "TENDENCIA").trim().toUpperCase().slice(0, 40);
    const rewardCoins = Number.parseInt(String(form.get("rewardCoins") || "0"), 10);
    const thumbnailUrl = String(form.get("thumbnailUrl") || "").trim().slice(0, 1000) || null;
    if (!title) return NextResponse.json({ error: "Escribe el título del video." }, { status: 400 });
    if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "Selecciona un archivo de video." }, { status: 400 });
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(file.type) || file.size < 1 || file.size > 100 * 1024 * 1024) return NextResponse.json({ error: "Formato no permitido. Sube MP4, WEBM o MOV de hasta 100 MB." }, { status: 400 });
    if (!Number.isInteger(rewardCoins) || rewardCoins < 0 || rewardCoins > 1000) return NextResponse.json({ error: "La recompensa debe estar entre 0 y 1000 monedas demo." }, { status: 400 });
    const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const key = `videos/${new Date().toISOString().slice(0,10)}/${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await storage().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
    const url = publicUrl(key);
    const result = await db().query(
      "INSERT INTO videos(title,description,creator,video_url,thumbnail_url,category,reward_coins,is_active,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,true,$8) RETURNING id,title,description,creator,video_url,thumbnail_url,category,reward_coins,is_active,created_at",
      [title, description, creator, url, thumbnailUrl, category, rewardCoins, user.id]
    );
    return NextResponse.json({ video: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("admin video upload", error);
    return NextResponse.json({ error: "No se pudo subir el video. Revisa el formato y vuelve a intentarlo." }, { status: 500 });
  }
}
export async function PATCH(request) {
  const user = await getUser(request);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { videoId, isActive } = await request.json();
    if (!Number.isSafeInteger(Number(videoId)) || typeof isActive !== "boolean") return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    const result = await db().query("UPDATE videos SET is_active=$1 WHERE id=$2 RETURNING id,is_active", [isActive, videoId]);
    if (!result.rows.length) return NextResponse.json({ error: "Video no encontrado." }, { status: 404 });
    return NextResponse.json({ video: result.rows[0] });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el video." }, { status: 500 });
  }
}
