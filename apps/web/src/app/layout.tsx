import type { Metadata } from "next";
import AuthSessionSync from "@/app/auth-session-sync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowix MVP",
  description: "Flowix MVP web app",
  icons: {
    icon: "/fav.png",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <AuthSessionSync />
        {children}
      </body>
    </html>
  );
}
