"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { ArrowUpRight, BadgeCheck, CreditCard, ImagePlus, LayoutDashboard, LockKeyhole, LogOut, Package, Save, ShoppingBag, SlidersHorizontal, Trash, Upload } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { products as defaultProducts } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/store-settings";
import { defaultStoreSettings } from "@/lib/store-settings";
import { jmd } from "@/lib/money";
const DEMO=process.env.NEXT_PUBLIC_STORE_DEMO==="1";
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client:SupabaseClient|null=URL&&ANON&&!DEMO?createClient(URL,ANON):null;
type Tab="overview"|"products"|"orders"|"contact"|"bank"|"store";
type EditableProduct={product:Product;active:boolean;sort_order:number};
type Order={
 id:string;reference:string;created_at:string;customer_name:string;
 email:string|null;phone:string;parish:string;address:string|null;
 fulfillment:string;payment_method:string;payment_status:string;status:string;
 lines:Array<{name:string;quantity:number;size:string;unitPriceJmd:number|null}>;
 priced_subtotal_jmd:number;has_unpriced:boolean;receipt_path:string|null;
};
type DataSet={catalog:Product[];overrides:Array<{id:string;data:Product;active:boolean;sort_order:number}>};
const statuses=["new_request","quoted","confirmed","pending","awaiting_payment","payment_submitted","payment_verified","processing","ready_for_pickup","dispatched","completed","cancelled","fulfilled"];
const paymentStatuses=["unpaid","submitted","verified","not_required"];
const menu:Array<{id:Tab;name:string;icon:typeof LayoutDashboard}>=[
 {id:"overview",name:"Overview",icon:LayoutDashboard},
 {id:"products",name:"Products & prices",icon:Package},
 {id:"orders",name:"Orders",icon:ShoppingBag},
 {id:"contact",name:"Contact details",icon:SlidersHorizontal},
 {id:"bank",name:"Bank transfer",icon:CreditCard},
 {id:"store",name:"Store settings",icon:BadgeCheck}
];
const nice=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const Input=({label,value,onChange,type="text",placeholder="",disabled=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;disabled?:boolean})=>
 <label className="manager-field"><span>{label}</span><input type={type} disabled={disabled} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></label>;
const Toggle=({label,checked,onChange,hint}:{label:string;checked:boolean;onChange:(v:boolean)=>void;hint?:string})=>
 <label className="manager-toggle"><span><strong>{label}</strong>{hint&&<small>{hint}</small>}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/></label>;

export function AdminDashboard(){
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 const [loginError,setLoginError]=useState("");
 const [tab,setTab]=useState<Tab>("overview");
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [settings,setSettings]=useState<StoreSettings>(defaultStoreSettings);
 const [catalog,setCatalog]=useState<Product[]>(defaultProducts);
 const [overrides,setOverrides]=useState<DataSet["overrides"]>([]);
 const [orders,setOrders]=useState<Order[]>([]);
 const [selected,setSelected]=useState<EditableProduct|null>(null);
 const [passwordConfirm,setPasswordConfirm]=useState("");
 const [orderFilter,setOrderFilter]=useState("all");
 const [uploading,setUploading]=useState(false);
 useEffect(()=>{
  if(!client)return;
  client.auth.getSession().then(({data})=>setSession(data.session));
  const {data:listener}=client.auth.onAuthStateChange((_event,s)=>setSession(s));
  return ()=>listener.subscription.unsubscribe();
 },[]);
 const token=session?.access_token;
 async function request(path:string,options:RequestInit={}) {
   if(!token)throw Error("You must sign in again.");
   const response=await fetch("/api/admin/"+path,{...options,headers:{Authorization:"Bearer "+token,...options.headers}});
   const data=await response.json();
   if(!response.ok||!data.ok)throw Error(data.message||"The request could not be completed.");
   return data;
 }
 async function refresh(){
  if(!token)return;
  setBusy(true);setMessage("");
  try{
   const [s,p,o]=await Promise.all([request("settings"),request("products"),request("orders")]);
   setSettings({...defaultStoreSettings,...s.settings});setCatalog(p.catalog);setOverrides(p.overrides);setOrders(o.orders);
  }catch(e){setMessage(e instanceof Error?e.message:"Could not load dashboard.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{if(token)void refresh();},[token]); // initial load after a confirmed Supabase session
 async function signIn(e:FormEvent){e.preventDefault();if(!client)return;setBusy(true);setLoginError("");
   const result=await client.auth.signInWithPassword({email,password});setBusy(false);setPassword("");
   if(result.error)setLoginError("Login failed. Check your credentials and owner authorisation.");
 }
 async function signOut(){await client?.auth.signOut();setSession(null);setOrders([]);setMessage("");}
 async function saveSettings(){
  setBusy(true);setMessage("");
  try{
   const result=await request("settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings,passwordConfirmation:passwordConfirm})});
   setSettings({...defaultStoreSettings,...result.settings});setMessage("Settings saved. The live storefront will use the updated values.");
   setPasswordConfirm("");
  }catch(e){setMessage(e instanceof Error?e.message:"Could not save settings.");}
  finally{setBusy(false);}
 }
 function pickProduct(product:Product){
   const row=overrides.find(o=>o.id===product.id);
   const order=catalog.findIndex(p=>p.id===product.id);
   setSelected({product:JSON.parse(JSON.stringify(row?.data||product)),active:row?.active??true,sort_order:row?.sort_order??order});
 }
 async function saveProduct(){
  if(!selected)return;
  setBusy(true);setMessage("");
  try{
   await request("products",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(selected)});
   setMessage(selected.product.name+" saved. Store visitors will see updated prices and availability.");
   const p=await request("products");setCatalog(p.catalog);setOverrides(p.overrides);
  }catch(e){setMessage(e instanceof Error?e.message:"Could not save product.");}finally{setBusy(false);}
 }
 function startProduct(){
  const id="oil-"+Math.random().toString(36).slice(2,8);
  setSelected({active:false,sort_order:catalog.length,product:{
    id,slug:"new-botanical-oil-"+id.slice(4),name:"New botanical oil",subtitle:"Coming soon",category:["Hair"],
    accent:"amber",description:"",benefits:[],howToUse:"",ingredientsNote:"",caution:"For external use only.",
    image:"",labelImage:"",featured:false,badge:"Coming soon",variants:[{id:id+"-60",label:"2 fl oz · 60 mL",ml:60,priceJmd:null,available:false}]
  }});
 }
 async function uploadProductImage(file:File,field:"image"|"labelImage"){
   if(!selected)return;
   setUploading(true);setMessage("");
   try{
    const form=new FormData();form.set("image",file);
    const result=await request("media",{method:"POST",body:form});
    setSelected(old=>old?{...old,product:{...old.product,[field]:result.url}}:null);
    setMessage("Image uploaded. Save the product to publish it.");
   }catch(e){setMessage(e instanceof Error?e.message:"Image upload failed.");}finally{setUploading(false);}
 }
 async function updateOrder(order:Order,status:string,payment_status:string){
   setBusy(true);setMessage("");
   try{
    const result=await request("orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:order.reference,status,payment_status})});
    setOrders(current=>current.map(o=>o.reference===order.reference?result.order:o));
    setMessage("Order "+order.reference+" updated.");
   }catch(e){setMessage(e instanceof Error?e.message:"Order update failed.");}finally{setBusy(false);}
 }
 async function showReceipt(reference:string){
   try{const data=await request("receipt?reference="+encodeURIComponent(reference));window.open(data.url,"_blank","noopener,noreferrer");}
   catch(e){setMessage(e instanceof Error?e.message:"Receipt unavailable.");}
 }
 const filteredOrders=orders.filter(o=>orderFilter==="all"||o.status===orderFilter);
 const revenue=orders.filter(o=>o.status==="completed"&&o.payment_status==="verified").reduce((n,o)=>n+o.priced_subtotal_jmd,0);
 const update=(key:keyof StoreSettings,val:StoreSettings[typeof key])=>setSettings(s=>({...s,[key]:val}));
 const fields=(list:Array<[keyof StoreSettings,string,string?]>)=>list.map(([key,label,type])=><Input key={key} label={label} type={type||"text"} value={String(settings[key]??"")} onChange={value=>update(key,value as never)}/>);
 if(DEMO)return <section className="section manager-locked"><LockKeyhole size={42}/><span className="eyebrow">FOR THE STORE OWNER</span><h1>Store management</h1><p>This is a public design preview. Product editing, customer data and banking information are deliberately disabled here. The protected owner dashboard becomes available when the production database and hosting are configured.</p></section>;
 if(!client)return <section className="section manager-locked"><LockKeyhole size={42}/><h1>Owner dashboard setup</h1><p>Configure the Supabase project URL, public anon key, service role key and migration before opening the private manager. See the repository’s setup guide. No credentials should be pasted into public pages.</p></section>;
 if(!session)return <section className="section manager-login"><form onSubmit={signIn} className="manager-login-card"><LockKeyhole size={35}/><span className="eyebrow">PRIVATE OWNER ACCESS</span><h1>Welcome back.</h1><p>Sign in to manage Cardone’s products, prices, orders and payment settings.</p><Input label="Owner email" type="email" value={email} onChange={setEmail}/><Input label="Password" type="password" value={password} onChange={setPassword}/>{loginError&&<p role="alert" className="status-note error">{loginError}</p>}<button type="submit" disabled={busy} className="button button-dark full">{busy?"Signing in…":"Sign in securely"}</button></form></section>;
 return <section className="manager-shell"><aside className="manager-sidebar"><div className="manager-logo">CARDONE’S <small>MANAGEMENT</small></div><nav aria-label="Management navigation">{menu.map(({id,name,icon:Icon})=><button key={id} className={tab===id?"selected":""} onClick={()=>{setTab(id);setMessage("");setSelected(null)}}><Icon size={18}/>{name}</button>)}</nav><button className="manager-logout" onClick={signOut}><LogOut size={18}/> Sign out</button></aside>
  <div className="manager-content"><div className="manager-top"><div><span className="eyebrow">CARDONE’S / PRIVATE MANAGEMENT</span><h1>{nice(tab)}</h1></div><a href="/" target="_blank" rel="noopener noreferrer">View storefront <ArrowUpRight size={16}/></a></div>
  {message&&<div role="status" className="manager-notice">{message}</div>}
  {busy&&<div role="status" className="manager-progress">Saving or retrieving store data…</div>}
  {tab==="overview"&&<><div className="manager-stats"><div><span>Listed products</span><strong>{catalog.length}</strong><small>Includes coming-soon oils</small></div><div><span>Order requests</span><strong>{orders.length}</strong><small>From the real order database</small></div><div><span>Completed verified sales</span><strong>{jmd(revenue)}</strong><small>Only completed, verified records</small></div></div><div className="manager-panel"><h2>Store launch controls</h2><p>The store is currently <strong>{settings.store_open?"open for online requests":"closed for online requests"}</strong>. Configure banking, delivery, policies and contact details before enabling real orders.</p><button className="button button-dark" onClick={()=>setTab("store")}>Review store settings</button></div></>}
  {tab==="contact"&&<div className="manager-panel"><h2>Business contact details</h2><p>These settings feed the storefront footer, contact links and WhatsApp ordering.</p><div className="manager-grid">{fields([["business_phone","Business telephone"],["whatsapp_number","WhatsApp number (Jamaican or international)"],["support_email","Customer service email","email"],["instagram_url","Instagram URL","url"],["facebook_url","Facebook URL","url"],["business_location","Business location"],["contact_hours","Contact hours"]])}</div><button className="button button-dark" disabled={busy} onClick={saveSettings}><Save size={18}/> Save contact details</button></div>}
  {tab==="bank"&&<div className="manager-panel"><h2>Bank-transfer information</h2><p>Only confirmed owner accounts can change these details. Re-enter your password when saving banking changes. Never enter an online banking password, PIN or card credentials here.</p><Toggle label="Enable bank transfer at checkout" checked={settings.bank_enabled} onChange={v=>update("bank_enabled",v)}/><div className="manager-grid">{fields([["bank_name","Bank name"],["bank_holder","Account holder"],["bank_account","Account number"],["bank_branch","Branch"],["bank_type","Account type"],["bank_instructions","Payment instructions"]])}</div><div className="manager-bank-preview"><span className="eyebrow">CUSTOMER VIEW</span><strong>{settings.bank_name||"Bank name not set"}</strong><p>{settings.bank_holder||"Account holder"} · {settings.bank_type||"Account type"}</p><p>{settings.bank_account||"Account number not set"}</p><small>Bank payments always require independent merchant verification.</small></div><Input label="Confirm your account password before changing banking settings" type="password" value={passwordConfirm} onChange={setPasswordConfirm}/><button className="button button-dark" disabled={busy} onClick={saveSettings}><Save size={18}/> Save bank details</button></div>}
  {tab==="store"&&<div className="manager-panel"><h2>Launch, delivery & checkout</h2><Toggle label="Accept real online order requests" checked={settings.store_open} onChange={v=>update("store_open",v)} hint="Keep this disabled until everything has been tested on your commercial host."/><Toggle label="Cash on delivery / pickup" checked={settings.cod_enabled} onChange={v=>update("cod_enabled",v)}/><Toggle label="WhatsApp ordering" checked={settings.whatsapp_enabled} onChange={v=>update("whatsapp_enabled",v)}/><Toggle label="Offer delivery" checked={settings.delivery_enabled} onChange={v=>update("delivery_enabled",v)}/><Toggle label="Offer pickup" checked={settings.pickup_enabled} onChange={v=>update("pickup_enabled",v)}/><div className="manager-grid">{fields([["delivery_text","Delivery instructions"],["returns_text","Returns and exchanges policy"]])}<label className="manager-field"><span>Confirmed delivery fee, JMD (leave empty if quoted later)</span><input type="number" min="0" value={settings.delivery_fee_jmd??""} onChange={e=>update("delivery_fee_jmd",e.target.value===""?null:Number(e.target.value))}/></label></div><button className="button button-dark" disabled={busy} onClick={saveSettings}><Save size={18}/> Save store settings</button></div>}
  {tab==="products"&&<div className="manager-panel manager-products"><div className="manager-panel-heading"><div><h2>Product catalogue</h2><p>Choose a product to change prices, variants, photographs or availability.</p></div><button className="button button-outline-dark" onClick={startProduct}>+ Add product</button></div>
   {!selected?<div className="manager-products-list">{catalog.map(p=><button key={p.id} onClick={()=>pickProduct(p)}><span>{p.name}<small>{p.variants.map(v=>v.label).join(" · ")} · {overrides.find(o=>o.id===p.id)?.active===false?"Hidden":"Visible"}</small></span><strong>{p.variants.some(v=>v.priceJmd!==null)?jmd(p.variants.find(v=>v.priceJmd!==null)?.priceJmd||0):"Not priced"}</strong></button>)}</div>
   :<div className="manager-product-editor"><button className="text-button" onClick={()=>setSelected(null)}>← Back to products</button><h3>Edit {selected.product.name}</h3><div className="manager-grid">
   {(["name","subtitle","slug","description","howToUse","ingredientsNote","caution"] as const).map(key=><Input key={key} label={nice(key)} value={selected.product[key]} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,[key]:v}}:null)}/>)}
   <Input label="Benefits (one per line)" value={selected.product.benefits.join("\n")} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,benefits:v.split("\n").map(s=>s.trim()).filter(Boolean)}}:null)}/>
   <label className="manager-field"><span>Category</span><select value={selected.product.category[0]} onChange={e=>setSelected(o=>o?{...o,product:{...o.product,category:[e.target.value as "Hair"|"Skin"|"Multipurpose"]}}:null)}><option>Hair</option><option>Skin</option><option>Multipurpose</option></select></label>
   <label className="manager-field"><span>Image colour palette</span><select value={selected.product.accent} onChange={e=>setSelected(o=>o?{...o,product:{...o.product,accent:e.target.value as Product["accent"]}}:null)}>{["amber","coconut","olive","palm","jojoba","rosemary","avocado"].map(x=><option key={x}>{x}</option>)}</select></label>
   <Input label="Listing badge (e.g. Sold out or Coming soon)" value={selected.product.badge||""} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,badge:v}}:null)}/>
   <Input label="Product image URL" value={selected.product.image||""} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,image:v}}:null)}/>
   <Input label="Original label image URL" value={selected.product.labelImage||""} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,labelImage:v}}:null)}/>
   <label className="manager-field"><span>Display order</span><input type="number" value={selected.sort_order} onChange={e=>setSelected(o=>o?{...o,sort_order:Number(e.target.value)}:null)}/></label>
   </div><div className="manager-uploaders"><label><ImagePlus size={18}/> Upload new bottle photo<input accept="image/png,image/jpeg,image/webp" type="file" disabled={uploading} onChange={e=>e.target.files?.[0]&&uploadProductImage(e.target.files[0],"image")}/></label><label><Upload size={18}/> Upload original label artwork<input accept="image/png,image/jpeg,image/webp" type="file" disabled={uploading} onChange={e=>e.target.files?.[0]&&uploadProductImage(e.target.files[0],"labelImage")}/></label></div><h4>Bottle sizes and prices</h4>{selected.product.variants.map((v,i)=><div className="manager-variant" key={v.id}>
     <Input label="Variant ID" value={v.id} onChange={text=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.map((a,j)=>j===i?{...a,id:text}:a)}}:null)}/>
     <Input label="Size label" value={v.label} onChange={text=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.map((a,j)=>j===i?{...a,label:text}:a)}}:null)}/>
     <label className="manager-field"><span>mL</span><input type="number" min="1" value={v.ml} onChange={e=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.map((a,j)=>j===i?{...a,ml:Number(e.target.value)}:a)}}:null)}/></label>
     <label className="manager-field"><span>Price in JMD (blank = quotation)</span><input type="number" min="0" value={v.priceJmd??""} onChange={e=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.map((a,j)=>j===i?{...a,priceJmd:e.target.value===""?null:Number(e.target.value)}:a)}}:null)}/></label>
     <Toggle label="Available for enquiry / ordering" checked={v.available} onChange={value=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.map((a,j)=>j===i?{...a,available:value}:a)}}:null)}/>
     {selected.product.variants.length>1&&<button className="manager-delete" onClick={()=>setSelected(o=>o?{...o,product:{...o.product,variants:o.product.variants.filter((_,j)=>i!==j)}}:null)}><Trash size={16}/> Remove size</button>}
    </div>)}<button className="button button-outline-dark" onClick={()=>setSelected(o=>o?{...o,product:{...o.product,variants:[...o.product.variants,{id:o.product.id+"-"+Math.random().toString(36).slice(2,6),label:"New size",ml:60,priceJmd:null,available:false}]}}:null)}>+ Add a size</button>
    <Toggle label="Visible in the store" checked={selected.active} onChange={v=>setSelected(o=>o?{...o,active:v}:null)}/>
    <Toggle label="Featured on the homepage" checked={!!selected.product.featured} onChange={v=>setSelected(o=>o?{...o,product:{...o.product,featured:v}}:null)}/>
    <button className="button button-dark" disabled={busy||uploading} onClick={saveProduct}><Save size={18}/> Save product</button>
   </div>}</div>}
  {tab==="orders"&&<div className="manager-panel"><h2>Order requests</h2><p>Payment verification must be performed independently. A submitted receipt is not evidence of cleared funds.</p><label className="manager-field"><span>Filter orders</span><select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)}><option value="all">All orders</option>{statuses.map(s=><option key={s} value={s}>{nice(s)}</option>)}</select></label>{filteredOrders.length===0?<p>No orders match this view.</p>:<div className="manager-order-list">{filteredOrders.map(order=><article className="manager-order" key={order.id}><div className="manager-order-head"><div><strong>{order.reference}</strong><small>{new Date(order.created_at).toLocaleString("en-JM")}</small></div><strong>{jmd(order.priced_subtotal_jmd)}{order.has_unpriced?" + quotation":""}</strong></div><p><strong>{order.customer_name}</strong> · {order.phone} · {order.parish}</p><p>{order.lines.map(l=>l.quantity+" × "+l.name+" ("+l.size+")").join("; ")}</p><small>{nice(order.fulfillment)} · {nice(order.payment_method)}</small><div className="manager-order-controls"><label>Status<select value={order.status} onChange={e=>updateOrder(order,e.target.value,order.payment_status)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Payment<select value={order.payment_status} onChange={e=>updateOrder(order,order.status,e.target.value)}>{paymentStatuses.map(s=><option key={s}>{s}</option>)}</select></label>{order.receipt_path&&<button className="button button-outline-dark" onClick={()=>showReceipt(order.reference)}>View private receipt</button>}</div></article>)}</div>}</div>}
  </div></section>;
}
