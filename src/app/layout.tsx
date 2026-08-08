import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat | Explore guraidhoo",
  description:
    "AI-powered Guraidhoo travel guide. Discover accommodations, restaurants, activities, transport options, and local information of K.Guraidhoo.",
  openGraph: {
    title: "Explore Guraidhoo Chat",
    description:
      "AI-powered Guraidhoo travel guide. Discover accommodations, restaurants, activities, transport options, and local information of K.Guraidhoo.",
    url: "https://ai.devemm.com",
    siteName: "Explore Guraidhoo Chat",
    images: [
      {
        url: "https://ai.devemm.com/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Explore Guraidhoo Chat Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Guraidhoo Chat",
    images: ["https://ai.devemm.com/og-image.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Explore Guraidhoo Chat"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph / Safari Preview */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Explore Guraidhoo Chat" />
        <meta
          property="og:description"
          content="AI-powered Guraidhoo travel guide. Discover accommodations, restaurants, activities, transport options, and local information of K.Guraidhoo."
        />
        <meta
          property="og:image"
          content="https://ai.devemm.com/og-image.webp"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Fallback  */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Explore Guraidhoo Chat" />
        <meta
          name="twitter:image"
          content="https://ai.devemm.com/og-image.webp"
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
