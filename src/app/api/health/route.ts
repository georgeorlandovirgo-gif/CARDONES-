import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return NextResponse.json({ store: "Cardone's Products", ordersEnabled: ready, paymentProcessing: false }, { headers: { "Cache-Control": "no-store" } });
}