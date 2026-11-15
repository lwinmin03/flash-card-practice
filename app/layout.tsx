import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kanji Cards",
    template: "%s · Kanji Cards",
  },
  description:
    "A mobile-first JLPT kanji flashcard app. Review readings and meanings one card at a time.",
  applicationName: "Kanji Cards",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kanji Cards",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1015" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
