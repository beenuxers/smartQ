import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ui = IBM_Plex_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SmartQ — Tables ready on WhatsApp",
  description:
    "QR + WhatsApp virtual waitlist for cafes and restaurants in Singapore, Indonesia, and Malaysia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
