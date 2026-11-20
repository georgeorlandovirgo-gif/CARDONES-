/** Explicit Jamaican-dollar prefix; avoids browsers rendering JMD as ambiguous "$". */
export function jmd(amount:number):string {
 return "J$" + new Intl.NumberFormat("en-JM",{maximumFractionDigits:0}).format(amount);
}
