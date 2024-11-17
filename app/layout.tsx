import BackpackWalletProvider from "@/app/providers/BackpackWalletProvider";
import "@/app/styles/wallet-adapter.css";
import "@/app/globals.css";

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
      </body>
    </html>
  );
}
