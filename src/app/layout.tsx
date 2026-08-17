import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORM//COACH",
  description:
    "Personalized fitness coaching, workouts, progress tracking, and training support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}