export const parishes = ['Kingston','St. Andrew','St. Catherine','Clarendon','Manchester','St. Elizabeth','Westmoreland','Hanover','St. James','Trelawny','St. Ann','St. Mary','Portland','St. Thomas'] as const;
export function jamaicanPhone(raw:string):string|null {
 if(!/^[+\d ()-]+$/.test(raw))return null;
 const digits=raw.replace(/\D/g,'');
 return /^(?:1)?(?:876|658)\d{7}$/.test(digits)?(digits.length===10?'1'+digits:digits):null;
}
