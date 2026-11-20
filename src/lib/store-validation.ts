import { z } from "zod";

const short = (max=160) => z.string().trim().max(max);
const url = z.union([z.literal(""),z.string().trim().url().max(500)]);
export const settingsSchema = z.object({
  business_phone: short(30), whatsapp_number: short(30),
  support_email: z.union([z.literal(""),z.string().trim().email().max(150)]),
  instagram_url:url, facebook_url:url,
  business_location:short(200), contact_hours:short(240),
  delivery_text:short(1800),returns_text:short(1800),
  bank_name:short(120),bank_holder:short(160),bank_account:short(50),
  bank_branch:short(120),bank_type:short(100),bank_instructions:short(600),
  bank_enabled:z.boolean(),cod_enabled:z.boolean(),whatsapp_enabled:z.boolean(),
  pickup_enabled:z.boolean(),delivery_enabled:z.boolean(),store_open:z.boolean(),
  delivery_fee_jmd:z.number().int().min(0).max(100000).nullable(),
}).superRefine((s,ctx) => {
 if(s.bank_enabled && (!s.bank_name || !s.bank_holder || !s.bank_account)) ctx.addIssue({code:"custom",path:["bank_enabled"],message:"Enter bank name, account holder, and account number before enabling bank transfers."});
 if(s.whatsapp_enabled && !/^(\+?1)?[0-9 \-()]{10,18}$/.test(s.whatsapp_number)) ctx.addIssue({code:"custom",path:["whatsapp_number"],message:"Enter a valid business WhatsApp number."});
 if(s.store_open && !s.bank_enabled && !s.cod_enabled && !s.whatsapp_enabled) ctx.addIssue({code:"custom",path:["store_open"],message:"Enable at least one order method before opening the store."});
});
const productVariantSchema = z.object({
 id:z.string().regex(/^[a-z0-9-]{2,60}$/),
 label:short(80).min(2), ml:z.number().positive().max(10000),
 priceJmd:z.number().int().min(0).max(10000000).nullable(),
 available:z.boolean()
});
export const productSchema = z.object({
 id:z.string().regex(/^[a-z0-9-]{2,60}$/),
 slug:z.string().regex(/^[a-z0-9-]{2,100}$/),
 name:short(100).min(2),subtitle:short(150),
 category:z.array(z.enum(["Hair","Skin","Multipurpose"])).min(1).max(3),
 accent:z.enum(["amber","coconut","olive","palm","jojoba","rosemary","avocado"]),
 image:z.union([z.literal(""),z.string().url().max(700),z.string().startsWith("/images/")]).optional(),
 labelImage:z.union([z.literal(""),z.string().url().max(700),z.string().startsWith("/images/")]).optional(),
 description:short(1500),benefits:z.array(short(240)).max(12),
 howToUse:short(1700),ingredientsNote:short(1700),caution:short(1700),
 featured:z.boolean().optional(),badge:short(70).optional(),
 variants:z.array(productVariantSchema).min(1).max(20)
}).superRefine((p,ctx)=>{
 const ids=p.variants.map(v=>v.id);
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:"custom",path:["variants"],message:"Each size must have a unique ID."});
});
export const productUpdateSchema=z.object({
 product:productSchema,active:z.boolean(),sort_order:z.number().int().min(-100000).max(100000)
});
export const orderStatusSchema=z.enum(["new_request","quoted","confirmed","pending","awaiting_payment","payment_submitted","payment_verified","processing","ready_for_pickup","dispatched","completed","cancelled","fulfilled"]);
