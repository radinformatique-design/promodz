import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BatiProm Algérie - ERP Promotion Immobilière',
  description: 'Système de gestion et gouvernance multi-chantiers pour promoteurs immobiliers en Algérie',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="h-full flex flex-col bg-slate-100">{children}</body>
    </html>
  );
}
