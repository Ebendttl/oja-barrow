import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ọjà — Nigeria's Open Digitized Market | Haggle, Buy, Sell & Deliver",
  description: "Experience the energy of Lagos markets online. Haggle for best prices directly with verified traders, buy physical goods with escrow protection, and get them delivered fast.",
  metadataBase: new URL("https://oja-barrow.ng"),
  openGraph: {
    title: "Ọjà — Nigeria's Open Digitized Market",
    description: "Haggle like the market. Pay like the internet.",
    type: "website",
    locale: "en_NG",
    siteName: "Ọjà",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-neutral text-brand-indigo font-sans selection:bg-brand-coral selection:text-white">
        {children}
      </body>
    </html>
  );
}
