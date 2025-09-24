import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ConditionalLayout from "../components/layout/ConditionalLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SwitchPilot - Bank Switching Automation",
  description: "Automate your bank switching to claim rewards and maximize your earnings",
  keywords: ["bank switching", "rewards", "automation", "fintech"],
  authors: [{ name: "SwitchPilot Team" }],
  openGraph: {
    title: "SwitchPilot - Bank Switching Automation",
    description: "Automate your bank switching to claim rewards and maximize your earnings",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
