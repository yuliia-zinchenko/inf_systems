import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TagShop Video — інтерактивні shoppable відео',
  description:
    'Перетворюйте будь-яке відео на інтерактивний каталог: додавайте товари до таймкодів, діліться посиланнями та вбудовуйте на свої сайти.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html
    lang="uk"
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
