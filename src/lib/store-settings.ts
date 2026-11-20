export type StoreSettings = {
  business_phone: string;
  whatsapp_number: string;
  support_email: string;
  instagram_url: string;
  facebook_url: string;
  business_location: string;
  contact_hours: string;
  delivery_text: string;
  returns_text: string;
  bank_name: string;
  bank_holder: string;
  bank_account: string;
  bank_branch: string;
  bank_type: string;
  bank_instructions: string;
  bank_enabled: boolean;
  cod_enabled: boolean;
  whatsapp_enabled: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  store_open: boolean;
  delivery_fee_jmd: number | null;
};
export const defaultStoreSettings: StoreSettings = {
  business_phone: "",
  whatsapp_number: "",
  support_email: "",
  instagram_url: "",
  facebook_url: "",
  business_location: "St. Elizabeth, Jamaica",
  contact_hours: "",
  delivery_text: "Delivery and pickup arrangements are confirmed before payment.",
  returns_text: "Contact the seller before returning an item.",
  bank_name: "", bank_holder: "", bank_account: "", bank_branch: "",
  bank_type: "", bank_instructions: "", bank_enabled: false,
  cod_enabled: false, whatsapp_enabled: false, pickup_enabled: true,
  delivery_enabled: true, store_open: false, delivery_fee_jmd: null
};
export function whatsappHref(number: string, message = ""): string | null {
  const digits = number.replace(/[^0-9]/g, "");
  const normalised = digits.length === 10 ? "1" + digits : digits;
  if (!/^1[0-9]{10}$/.test(normalised) && !/^[1-9][0-9]{7,14}$/.test(normalised)) return null;
  return "https://wa.me/" + normalised + (message ? "?text=" + encodeURIComponent(message) : "");
}
export function publicSettings(settings: StoreSettings): StoreSettings {
  return {
    ...settings,
    bank_account: settings.bank_enabled ? settings.bank_account : "",
    bank_name: settings.bank_enabled ? settings.bank_name : "",
    bank_holder: settings.bank_enabled ? settings.bank_holder : "",
    bank_branch: settings.bank_enabled ? settings.bank_branch : "",
    bank_type: settings.bank_enabled ? settings.bank_type : "",
    bank_instructions: settings.bank_enabled ? settings.bank_instructions : "",
  };
}
