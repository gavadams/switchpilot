import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ConditionalLayout from "../components/layout/ConditionalLayout";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Use system fonts as fallback to avoid Google Fonts build issues
const interFont = {
  className: "",
  variable: "--font-sans",
  style: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

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
    <html lang="en" className={interFont.variable}>
      <body className={`min-h-screen bg-background font-sans antialiased ${interFont.className}`} style={interFont.style}>
        <ErrorBoundary>
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
