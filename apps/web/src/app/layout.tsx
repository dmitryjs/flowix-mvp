import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flowix MVP",
  description: "Flowix MVP web app",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
