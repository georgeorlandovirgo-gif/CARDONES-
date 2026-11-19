export function jmd(amount: number): string {
  return new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", maximumFractionDigits: 0 }).format(amount);
}