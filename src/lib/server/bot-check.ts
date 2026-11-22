export class SecurityCheckError extends Error {}
export async function verifyBot(token:unknown,action:string){
 const secret=process.env.TURNSTILE_SECRET_KEY,hostname=process.env.TURNSTILE_HOSTNAME;
 if(!secret||!hostname)throw new SecurityCheckError('Secure checkout is not configured. Please contact Cardone’s.');
 if(typeof token!=='string'||!token||token.length>2048)throw new SecurityCheckError('Complete the security check and try again.');
 try{
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret,response:token}),signal:AbortSignal.timeout(8000)});
  const x=await r.json();
  if(!r.ok||x.success!==true||x.hostname!==hostname||x.action!==action)throw Error();
 }catch{throw new SecurityCheckError('Security check expired or failed. Please complete it again.');}
}
