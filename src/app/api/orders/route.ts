import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { variantById } from "@/lib/catalog";

export const runtime = "nodejs";
const requestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.union([z.string().trim().email().max(150), z.literal("")]).optional(),
  phone: z.string().trim().min(7).max(30),
  parish: z.string().trim().min(2).max(65),
  address: z.string().trim().max(240).optional(),
  fulfillment: z.enum(["pickup", "delivery"]),
  notes: z.string().trim().max(600).optional(),
  consent: z.literal(true),
  website: z.string().max(80).optional(),
  lines: z.array(z.object({ productId: z.string(), variantId: z.string(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
});

function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  try {
    const type = req.headers.get("content-type") || "";
    if (!type.includes("application/json")) return apiError("Expected JSON request.", 415);
    const data = requestSchema.safeParse(await req.json());
    if (!data.success) return apiError("Please check your contact details and shopping bag.");
    const info = data.data;
    if (info.website) return apiError("Unable to process request."); // honeypot
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return apiError("Online order requests are not active yet. Please contact Cardone's to order.", 503);
    const seen = new Set<string>();
    let subtotal = 0, hasUnpriced = false;
    const lines = info.lines.map((line) => {
      const id = `${line.productId}:${line.variantId}`;
      if (seen.has(id)) throw new Error("Duplicate items in order.");
      seen.add(id);
      const match = variantById(line.productId, line.variantId);
      if (!match || !match.variant.available) throw new Error("An item is not currently available for enquiry or order.");
      const { product, variant } = match;
      if (variant.priceJmd === null) hasUnpriced = true;
      else subtotal += variant.priceJmd * line.quantity;
      return { productId: product.id, name: product.name, variantId: variant.id, size: variant.label, quantity: line.quantity, unitPriceJmd: variant.priceJmd };
    });
    const ref = `CAR-${new Date().toISOString().slice(0,10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("store_orders").insert({
      reference: ref, customer_name: info.name, email: info.email || null,
      phone: info.phone, parish: info.parish, address: info.address || null,
      fulfillment: info.fulfillment, notes: info.notes || null,
      lines, priced_subtotal_jmd: subtotal, has_unpriced: hasUnpriced
    });
    if (error) {
      console.error("Order persistence error", error.code);
      return apiError("We could not save your request. Please try again or contact Cardone's directly.", 503);
    }

    // Optional merchant notification: order acceptance does not depend on email service availability.
    const resendKey = process.env.RESEND_API_KEY;
    const merchant = process.env.ORDER_NOTIFICATION_EMAIL;
    const sender = process.env.ORDER_FROM_EMAIL;
    if (resendKey && merchant && sender) {
      const detail = lines.map(x => `${x.quantity} × ${x.name} (${x.size}) — ${x.unitPriceJmd === null ? "Quote needed" : `J$${x.unitPriceJmd}`}`).join("\n");
      fetch("https://api.resend.com/emails", {
        method:"POST", headers: { Authorization:`Bearer ${resendKey}`, "Content-Type":"application/json" },
        body: JSON.stringify({ from:sender, to:[merchant], subject:`New Cardone's request ${ref}`, text:`Reference: ${ref}\nName: ${info.name}\nPhone: ${info.phone}\nEmail: ${info.email || "Not provided"}\nParish: ${info.parish}\nFulfilment: ${info.fulfillment}\nAddress: ${info.address || ""}\nNotes: ${info.notes || ""}\n\n${detail}\n\nPriced subtotal: J$${subtotal}\nQuotation required: ${hasUnpriced ? "Yes" : "No"}` })
      }).catch(() => console.error("Merchant notification could not be delivered"));
    }
    return NextResponse.json({ ok: true, reference: ref, quoted: hasUnpriced, pricedSubtotalJmd: subtotal, message: "Request received. We will confirm availability, prices and delivery before payment." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /Duplicate|not currently available/.test(error.message)) return apiError(error.message);
    return apiError("Something went wrong. Please review your information and try again.");
  }
}