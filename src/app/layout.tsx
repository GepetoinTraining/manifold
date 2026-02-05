import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Script from "next/script";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Manifold — Prime Topology Decoder",
  description: "Decode prime-encoded topologies into rendered UI applications. number → physics → interface",
  keywords: ["manifold", "prime", "topology", "decoder", "UI", "application"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#c9a227",
          colorBackground: "#0f0e0c",
          colorInputBackground: "#1a1814",
          colorText: "#e8e0d0",
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#c9a227" />
          <Script
            src="https://pay.google.com/gp/p/js/pay.js"
            strategy="lazyOnload"
          />
        </head>
        <body
          className={`${dmSans.variable} ${dmMono.variable} antialiased`}
          style={{
            background: "#0f0e0c",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {children}
          <Script id="sw-register" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
              }
            `}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
