import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Amiri } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fazakkir Academy | Learn Quran, Tajweed & Arabic Online",
  description: "Official Al-Azhar Certified Tutors • 2 Free Classes • 1-on-1 Personalized Classes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${amiri.variable}`}>
      <head>
        {/* Font Awesome 6 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Cloudflare Turnstile */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      </head>
        <body className="font-sans antialiased bg-slate-200/70 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 min-h-screen">
          <div className="max-w-[1360px] mx-auto bg-slate-50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] min-h-screen border-x border-slate-200/80">
          {children}
        </div>
        </body>
    </html>
  );
}