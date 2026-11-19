import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreProvider } from "@/components/StoreProvider";
import { CartDrawer } from "@/components/CartDrawer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cardones.example"),
  title: { default: "Cardone’s Products | Botanical Oils, Beautifully Bottled", template: "%s | Cardone’s Products" },
  description: "Shop Cardone’s collection of beautifully presented hair and skin oils, packaged in St. Elizabeth, Jamaica. Made with you in mind.",
  robots: process.env.NEXT_PUBLIC_STORE_DEMO === "1" ? { index: false, follow: false } : { index: true, follow: true },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="en"><body><StoreProvider>{process.env.NEXT_PUBLIC_STORE_DEMO === "1" && <div style={{background:"#23422c",color:"#fff",textAlign:"center",padding:"10px 14px",fontSize:"12px",letterSpacing:"0.09em",fontWeight:600}}>CARDONE’S PREVIEW STORE · FOR TESTING ONLY · NO REAL ORDERS OR PAYMENTS</div>}<Header/><main id="main-content">{children}</main><Footer/><CartDrawer/></StoreProvider></body></html>;
}