import { ok } from "@/lib/apiResponse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ status: "ok", timestamp: new Date().toISOString() });
}
