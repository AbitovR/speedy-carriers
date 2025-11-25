import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speedy Carriers - Driver Management",
  description: "Professional Driver Payment & Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
