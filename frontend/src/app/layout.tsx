import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
// import { Navigation } from '@/components/Navigation'; // Not yet created
// import { Footer } from '@/components/Footer'; // Not yet created
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AsyncFlow Commerce',
  description: 'AI-powered e-commerce platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.className}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {/* <Navigation /> */}
            <main className="flex-1">{children}</main>
            {/* <Footer /> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
