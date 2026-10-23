import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  display: "swap",
  variable: "--font-manrope",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: "PUNCH NextGen | Learn. Play. Earn.",
  description: "A student quiz and rewards platform from PUNCH NextGen.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
