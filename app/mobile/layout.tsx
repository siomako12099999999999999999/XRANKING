import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'XRANKING - モバイル',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XRANKING'
  },
  other: {
    'apple-mobile-web-app-title': 'XRANKING',
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
  }
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-layout">
      <div className="overscroll-none bg-black min-h-screen">
        {children}
      </div>
    </div>
  );
}