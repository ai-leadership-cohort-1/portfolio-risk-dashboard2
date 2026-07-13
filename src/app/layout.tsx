import type { Metadata } from "next";
import "./globals.css";
import { AnalysisProvider } from "@/context/AnalysisContext";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Portfolio Risk Dashboard",
  description: "Executive dashboard for lending portfolio risk analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AnalysisProvider>
          <NavBar />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-4">
            <p className="mx-auto max-w-6xl px-4 text-center text-xs text-[var(--muted)] sm:px-8">
              Prototype for internal review only. No real customer data. All
              processing happens locally in your browser — nothing is
              uploaded to a server.
            </p>
          </footer>
        </AnalysisProvider>
      </body>
    </html>
  );
}
