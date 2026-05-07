import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CS 152 Team Project",
  description: "Trust and Safety project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
