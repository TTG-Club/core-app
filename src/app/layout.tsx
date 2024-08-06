import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, ThemeConfig } from 'antd';
import 'normalize.css';
import '../assets/styles/index.scss';
import { Lora, Neucha, Open_Sans as OpenSans } from 'next/font/google';
import React from 'react';

import type { Metadata, Viewport } from 'next';

const loraFont = Lora({
  subsets: ['cyrillic'],
  display: 'swap',
  preload: true,
  variable: '--font-lora',
});

const openSansFont = OpenSans({
  subsets: ['cyrillic'],
  display: 'swap',
  preload: true,
  variable: '--font-open-sans',
});

const neuchaFont = Neucha({
  subsets: ['cyrillic'],
  display: 'swap',
  weight: '400',
  variable: '--font-neucha',
});

export const metadata: Metadata = {
  title: {
    template: '%s | TTG Club Oнлайн-справочник',
    default: 'TTG Club Oнлайн-справочник',
  },
  description:
    'TTG.Club - сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам - все в одном месте.',
  metadataBase: new URL('https://ttg.club'),
  robots: {
    index: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { type: 'image/svg+xml', url: '/favicon_ttg_v3.svg' },
      { type: 'image/png', url: '/favicon_ttg_v3.svg' },
      { sizes: '192x192', url: '/style/icons/192.png' },
    ],
    apple: [48, 72, 96, 144, 192, 256, 384, 512].map((size) => ({
      sizes: `${size}x${size}`,
      url: `/style/icons/${size}.png`,
    })),
  },
  authors: [
    {
      name: 'Magistrus',
      url: 'https://github.com/Magistrus',
    },
    {
      name: 'Peterko',
      url: 'https://www.behance.net/peterko',
    },
    {
      name: 'svifty7',
      url: 'https://github.com/svifty7',
    },
  ],
  openGraph: {
    type: 'website',
    siteName: 'ttg.club',
  },
  other: {
    'charset': 'utf-8',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const themeConfig: ThemeConfig = {
  hashed: false,
  token: {
    fontFamily: 'var(--font-open-sans)',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${neuchaFont.variable} ${loraFont.variable} ${openSansFont.variable}`}
      >
        <AntdRegistry>
          <ConfigProvider theme={themeConfig}>
            <div className="ttg-club">
              <div className="container">{children}</div>
            </div>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
