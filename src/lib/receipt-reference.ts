// Suggestions only: preserve characters, never silently change O/0 or I/1.
export function receiptReferences(text:string):string[]{
 const lines=text.slice(0,100000).split(/\r?\n/),found=new Set<string>();
 const label=/\b(?:transaction\s*(?:id|number|no\.?|reference)|receipt\s*(?:id|number|no\.?)|confirmation\s*(?:id|number|no\.?|code)|reference\s*(?:id|number|no\.?))\s*[:#=\-]?\s*([a-z0-9][a-z0-9/\-]{3,99})/i;
 for(let i=0;i<lines.length;i++){
  if(/\binvoice\b|\baccount\s*(?:number|no\.?)/i.test(lines[i]))continue;
  const match=(lines[i]+' '+(lines[i+1]||'')).match(label),value=match?.[1];
  if(!value||!/[0-9]/.test(value)||/^CAR-/i.test(value)||/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(value)||/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(value))continue;
  found.add(value);
 }
 return [...found];
}
