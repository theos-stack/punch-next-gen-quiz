import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUNCH NextGen | Learn. Play. Earn.",
  description: "A student quiz and rewards platform from PUNCH NextGen.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
