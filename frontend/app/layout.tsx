import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contextAPI/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ODI Final Project",
  description:
    "Final project for ODI course - secure messaging system with end-to-end encryption and 2FA",
  keywords: ["secure messaging", "encryption", "e2e", "2fa", "privacy"],
  authors: [{ name: "Igor Ochocki" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <AuthProvider>
          <div className="fixed inset-0 bg-dark-950 -z-10" />
          <div className="fixed inset-0 bg-cyber-grid bg-cyber-grid -z-10 opacity-50" />
          <div className="fixed inset-0 bg-gradient-radial from-primary-950/20 via-transparent to-transparent -z-10" />

          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
