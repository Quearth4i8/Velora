import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Velora - AI Character Creator',
  description: 'Create your perfect AI character with precision and style',
  icons: {
    icon: '/images/velora.png',
    shortcut: '/images/velora.png',
    apple: '/images/velora.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-950 text-white">
        {children}
      </body>
    </html>
  );
}
