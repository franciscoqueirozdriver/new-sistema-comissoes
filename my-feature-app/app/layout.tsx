import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/src/styles/globals.css";
import { SessionProvider } from "@/src/providers/SessionProvider";
import { PermissoesProvider } from "@/src/providers/PermissoesProvider";
import { UIProvider } from "@/src/providers/UIProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calculadora de DSR",
  description: "Aplicação autônoma para cálculo de DSR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          <PermissoesProvider>
            <UIProvider>
              <main className="container mx-auto p-4">
                {children}
              </main>
            </UIProvider>
          </PermissoesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
