import BackpackWalletProvider from "@/app/providers/BackpackWalletProvider";
import "@/app/styles/wallet-adapter.css";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner"

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
