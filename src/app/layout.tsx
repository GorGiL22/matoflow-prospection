import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ConditionalAppShell } from "@/components/layout/conditional-app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { APP_NAME } from "@/config/constants";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Agent IA de prospection pour MatoFlow — qualification et contenu commercial automatisés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
