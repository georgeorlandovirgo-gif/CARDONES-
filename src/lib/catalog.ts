export type Collection = "Hair" | "Skin" | "Multipurpose";
export type OilVariant = { id: string; label: string; ml: number; priceJmd: number | null; available: boolean; stockCount?: number | null };
export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: Collection[];
  accent: "amber" | "coconut" | "olive" | "palm" | "jojoba" | "rosemary" | "avocado";
  image?: string;
  labelImage?: string;
  description: string;
  benefits: string[];
  howToUse: string;
  ingredientsNote: string;
  caution: string;
  featured?: boolean;
  badge?: string;
  variants: OilVariant[];
};

// IMPORTANT: Prices not confirmed by the owner are NULL, never invented.
// Change priceJmd and available when a product and size are ready to sell.
// Server checkout ALWAYS uses these values rather than browser-supplied prices.
export const products: Product[] = [
  {
    id: "castor", slug: "castor-oil", name: "Castor Oil", subtitle: "The heritage favourite",
    category: ["Hair", "Skin", "Multipurpose"], accent: "amber", image: "/images/castor-studio-bottle.webp", labelImage: "/images/castor-label.webp",
    description: "A timeless staple for everyday hair, scalp, and skin routines, beautifully presented in our signature amber glass bottle.",
    benefits: ["Conditions dry hair", "Adds natural-looking shine", "Softens rough, dry skin", "Nourishes nails and cuticles"],
    howToUse: "Warm a few drops between palms, then work gently through the lengths of hair or massage onto dry skin. Use sparingly; castor oil has a naturally rich texture.",
    ingredientsNote: "Confirm the supplier's ingredient specification before publishing a full INCI ingredient declaration.",
    caution: "For external use only. Patch test first. Avoid contact with eyes. Discontinue if irritation develops.",
    featured: true, badge: "Signature", variants: [{ id: "castor-148", label: "5 fl oz · 148 mL", ml: 148, priceJmd: 1800, available: true }]
  },
  {
    id: "coconut", slug: "extra-virgin-coconut-oil", name: "Extra Virgin Coconut Oil", subtitle: "A routine of softness",
    category: ["Hair", "Skin", "Multipurpose"], accent: "coconut", image: "/images/coconut-bottle.webp", labelImage: "/images/coconut-label.webp",
    description: "A versatile, indulgent oil for a simple hair-and-body care routine, with a luxurious finish inspired by the tropics.",
    benefits: ["Pre-wash hair care", "Helps soften dry hair", "Moisturizes skin", "Ideal for body massage"],
    howToUse: "Massage a small amount onto skin or use as a pre-wash hair treatment. Coconut oil may naturally solidify in cooler temperatures; warm the sealed bottle gently in lukewarm water.",
    ingredientsNote: "Extra virgin designation must be verified against the supplier's documentation.",
    caution: "For external use only. Patch test first. Do not microwave the bottle.",
    featured: true, badge: "Coming soon", variants: [{ id: "coconut-148", label: "5 fl oz · 148 mL", ml: 148, priceJmd: null, available: false }]
  },
  {
    id: "olive", slug: "extra-virgin-olive-oil", name: "Extra Virgin Olive Oil", subtitle: "Golden everyday care",
    category: ["Hair", "Skin", "Multipurpose"], accent: "olive", image: "/images/olive-bottle.webp", labelImage: "/images/olive-label.webp",
    description: "A classic botanical oil selected for simple routines that leave hair feeling supple and skin comfortably moisturized.",
    benefits: ["Conditions dry hair and scalp", "Adds hair shine", "Softens and smooths", "Moisturizes dry skin"],
    howToUse: "Smooth a small amount through hair ends or massage onto dry skin. Apply a light amount first and adjust to your preference.",
    ingredientsNote: "Extra virgin designation must be verified against the supplier's documentation.",
    caution: "For external use only. Patch test first. Avoid eyes.",
    featured: true, badge: "Coming soon", variants: [
      { id: "olive-60", label: "2 fl oz · 60 mL", ml: 60, priceJmd: null, available: false },
      { id: "olive-148", label: "5 fl oz · 148 mL", ml: 148, priceJmd: null, available: false }
    ]
  },
  {
    id: "jojoba", slug: "golden-jojoba-oil", name: "Golden Jojoba Oil", subtitle: "Lightweight botanical luxury",
    category: ["Hair", "Skin", "Multipurpose"], accent: "jojoba", image: "/images/jojoba-bottle.webp", labelImage: "/images/jojoba-label.webp",
    description: "An elegant golden oil with a beautiful slip for face, body, and hair-care routines.",
    benefits: ["Moisturizes dry skin", "Conditions hair and scalp", "Helps tame frizz", "Softens cuticles"],
    howToUse: "Gently smooth two or three drops over hair ends or massage a small amount onto clean skin. Start with a few drops.",
    ingredientsNote: "Confirm ingredient purity and production method with the supplier.",
    caution: "For external use only. Patch test first. Avoid contact with eyes.",
    featured: true, badge: "Coming soon", variants: [{ id: "jojoba-60", label: "2 fl oz · 60 mL", ml: 60, priceJmd: null, available: false }]
  },
  {
    id: "palm", slug: "palm-oil", name: "Palm Oil", subtitle: "Rich and restorative feel",
    category: ["Hair", "Skin"], accent: "palm", featured: true, image: "/images/palm-bottle.webp", labelImage: "/images/palm-label.webp",
    description: "A rich tropical oil traditionally used in body-care and hair-conditioning routines.",
    benefits: ["Conditions dry hair", "Adds a soft-looking sheen", "Softens dry skin", "Ideal for body massage"],
    howToUse: "Warm a small quantity between the palms before applying to dry skin or hair lengths. Use carefully to avoid staining fabrics.",
    ingredientsNote: "Verify whether this is palm fruit oil or palm kernel oil before confirming the final ingredient declaration.",
    caution: "For external use only. Patch test first. Product type must be confirmed before sale.",
    badge: "Coming soon", variants: [{ id: "palm-148", label: "5 fl oz · 148 mL", ml: 148, priceJmd: null, available: false }]
  },
  {
    id: "rosemary", slug: "rosemary-oil", name: "Rosemary Oil", subtitle: "A botanical scalp routine",
    category: ["Hair"], accent: "rosemary", image: "/images/rosemary-bottle.webp", labelImage: "/images/rosemary-label.webp", featured: true,
    description: "Inspired by aromatic rosemary and the tradition of mindful scalp massage.",
    benefits: ["Scalp massage", "Pre-wash hair care", "Hair conditioning", "A refreshing botanical routine"],
    howToUse: "Instructions will be published once we confirm whether this is diluted/infused rosemary oil or concentrated essential oil.",
    ingredientsNote: "Formulation verification required: pure rosemary essential oil must not be presented as ready-to-use undiluted scalp oil.",
    caution: "Do not apply undiluted rosemary essential oil to skin. This product is not yet available to purchase online.",
    badge: "Coming soon", variants: [{ id: "rosemary-60", label: "2 fl oz · 60 mL", ml: 60, priceJmd: null, available: false }]
  },
  {
    id: "avocado", slug: "avocado-oil", name: "Avocado Oil", subtitle: "Velvety, versatile care",
    category: ["Hair", "Skin", "Multipurpose"], accent: "avocado",
    description: "A nourishing-feeling addition to the Cardone’s collection, designed for your everyday self-care routine.",
    benefits: ["Conditions dry hair", "Softens rough skin", "A smooth finish for massage", "Pre-wash hair care"],
    howToUse: "Apply sparingly to clean skin or hair lengths. Patch test before use.",
    ingredientsNote: "Confirm specific ingredient declaration with supplier.",
    caution: "For external use only. Patch test first. Not yet priced for online checkout.",
    badge: "Coming soon", variants: [
      { id: "avocado-60", label: "2 fl oz · 60 mL", ml: 60, priceJmd: null, available: false },
      { id: "avocado-148", label: "5 fl oz · 148 mL", ml: 148, priceJmd: null, available: false }
    ]
  }
];

export const featuredProducts = products.filter((p) => p.featured);
export function productBySlug(slug: string): Product | undefined { return products.find((p) => p.slug === slug); }
export function variantById(productId: string, variantId: string) {
  const product = products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return product && variant ? { product, variant } : null;
}