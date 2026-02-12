import type { Metadata } from "next";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "./globals.css";
import { SilkBackground } from "@/components/SilkBackground";

export const metadata: Metadata = {
  title: "Kelecung's Village",
  description: "Discover edible and inedible village plants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SilkBackground />
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
