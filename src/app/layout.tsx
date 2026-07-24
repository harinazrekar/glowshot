import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fira_Code, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const title = "Glowshot — Turn screenshots & code into gorgeous images";
const description =
  "A free, open-source studio for beautiful screenshots and code snippets. Add gradients, device frames, and shadows, then export in one click. No signup, 100% in your browser.";

// Resolves to the real deployment URL: an explicit site URL if set, otherwise
// the Vercel-provided host, falling back to localhost in development.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "screenshot beautifier",
    "code to image",
    "carbon alternative",
    "ray.so alternative",
    "screenshot tool",
    "open source",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${ibmPlexMono.variable} min-h-full antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
