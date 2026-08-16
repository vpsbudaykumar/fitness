import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Fitness Coach",
  description: "Safety-first AI-guided workouts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink text-white min-h-screen">{children}</body>
    </html>
  );
}
