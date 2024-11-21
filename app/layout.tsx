import BackpackWalletProvider from "@/app/providers/BackpackWalletProvider";
import "@/app/styles/wallet-adapter.css";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The First Landing |  Eclipse × Backpack × $LAIKA',
  description: 'Embark on an expedition to Eclipse to claim your LAIKA rewards.',
  openGraph: {
    title: 'The First Landing | Eclipse × Backpack × $LAIKA ',
    description: 'Embark on an expedition to Eclipse to claim your LAIKA rewards.',
    images: [
      {
        url: '/assets/background.jpg',
        width: 1200,
        height: 630,
        alt: 'The First Landing',
      },
    ],
    type: 'website',
    url: 'https://firstlanding.laika.is',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The First Landing |  Eclipse × Backpack × $LAIKA',
    description: 'Embark on an expedition to Eclipse to claim your LAIKA rewards.',
    images: ['/assets/background.jpg'],
    creator: '@laikaoneclipse',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black">
        <BackpackWalletProvider>
          {children}
        </BackpackWalletProvider>
        <Toaster/>
      </body>
    </html>
  );
}
