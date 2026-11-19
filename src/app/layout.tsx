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
  robots: { index: true, follow: true },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="en"><body><StoreProvider><Header/><main id="main-content">{children}</main><Footer/><CartDrawer/></StoreProvider></body></html>;
}