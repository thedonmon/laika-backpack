"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { generateVerificationToken } from "@/app/actions/verification";
import bs58 from 'bs58'
import { CheckCircle2 } from 'lucide-react';
import { toast } from "sonner"
import TwitterX from '@/public/assets/twitter-x.svg'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Footer from "@/components/Footer";

export default function LandingPage() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectedAdapter, setConnectedAdapter] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [bridgeCompleted, setBridgeCompleted] = useState(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!connected) {
      setProgress(0);
      return;
    }

    let currentProgress = 0;

    if (connectedAdapter === 'Backpack') {
      currentProgress = 25;
    }
    
    if (isVerified) {
      currentProgress = 50;
    }
    
    if (bridgeCompleted) {
      currentProgress = 75;
    }
    
    if (purchaseCompleted) {
      currentProgress = 100;
    }

    setProgress(currentProgress);
  }, [connected, connectedAdapter, isVerified, bridgeCompleted, purchaseCompleted]);

  useEffect(() => {
    if (wallet && connected) {
      setConnectedAdapter(wallet.adapter.name);
    }
    else {
      setConnectedAdapter(null);
    }
  }, [wallet, connected]);

  const handleVerify = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    
    setIsVerifying(true);
    try {
      // Create message to sign
      const message = `Verify wallet ownership for Eclipse Odyssey\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);
      
      // Get signature
      const signature = await signMessage(messageBytes);
      
      // Generate verification token
      await generateVerificationToken(publicKey.toString(), bs58.encode(signature));
      
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: publicKey.toString(),
          signature: bs58.encode(signature),
          message: Buffer.from(messageBytes).toString('base64')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Verification failed');
        throw new Error('Verification failed');
      }

      // Update verification states based on response
      setIsVerified(true);
      setBridgeCompleted(data.bridgeCompleted || false);
      setPurchaseCompleted(data.purchaseCompleted || false);
      toast.success('Verification successful');
    } catch (error) {
      toast.error('Verification failed');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  }, [publicKey, signMessage]);

  const handleShareTweet = () => {
    const tweetText = encodeURIComponent(
      "Just started my Eclipse Odyssey! 🚀✨ #FirstLanding #EclipseOdyssey"
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const handleInstallBackpack = () => {
    window.open('https://www.backpack.app/', '_blank');
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background.jpg"
          alt="Space background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Wallet Button */}
      <div className="absolute top-4 right-4 z-20">
        <WalletMultiButton />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto px-4 py-8 flex flex-col">
        {/* Logo section */}
        <div className="text-center mb-12">
          <Image
            src="/assets/firstlandinglogo.png"
            alt="The First Landing"
            width={400}
            height={100}
            className="mx-auto mb-4"
          />
        </div>
        
        {/* Cards section */}
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Steps with Progress */}
          <Progress 
            value={progress}
            className="w-full h-2 mb-6 bg-gray-200 border border-gray-100"
          />
          
          <div className="space-y-4">
            {/* Step 1 */}
            <Card className={`border transition-all duration-200 ${
              connectedAdapter === 'Backpack' ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
            }`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  connectedAdapter === 'Backpack' ? 'bg-green-500' : 'bg-gray-700'
                }`}>
                  {connectedAdapter === 'Backpack' ? (
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  ) : (
                    <span className="text-white">1</span>
                  )}
                </div>
                <CardTitle className="text-white">Download Backpack</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {connectedAdapter === 'Backpack' ? (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Backpack Connected</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstallBackpack}
                    className="bg-white text-black hover:bg-gray-200 px-8 py-2 rounded-full"
                  >
                    Download Backpack
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Step 2 */}
            

            {/* Optional Steps (only show when verified) */}
            {connected && (
              <>
                <Card className={`border transition-all duration-200 ${
                  bridgeCompleted ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
                }`}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white">2</span>
                    </div>
                    <CardTitle className="text-white">Bridge Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-300">
                      Bridge over $500 on ETH to Eclipse using the{" "}
                      <a href="your-bridge-url" className="text-blue-400 hover:underline">
                        official bridge
                      </a>
                    </p>
                  </CardContent>
                </Card>

                <Card className={`border transition-all duration-200 ${
                  purchaseCompleted ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
                }`}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white">3</span>
                    </div>
                    <CardTitle className="text-white">Buy $LAIKA</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-300">
                      Buy $LAIKA on{" "}
                      <a href="https://orca.so" className="text-blue-400 hover:underline">
                        orca.so
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            <Card className={`border transition-all duration-200 ${
              isVerified ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
            }`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isVerified ? 'bg-green-500' : 'bg-gray-700'
                }`}>
                  {isVerified ? (
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  ) : (
                    <span className="text-white">4</span>
                  )}
                </div>
                <CardTitle className="text-white">Connect & Verify</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {connected ? (
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="bg-[hsl(120,100%,88%)] text-black hover:bg-[hsl(120,100%,78%)] px-8 py-2 rounded-full"
                  >
                    {isVerifying ? 'Verifying...' : 'VERIFY'}
                  </Button>
                ) : (
                  <div className="text-gray-400 italic">
                    Please connect your wallet using the button above
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Share button */}
          <div className="flex justify-center mt-6 mb-24">
            <Button 
              onClick={handleShareTweet}
              className="bg-white text-black border-2 border-transparent hover:bg-black hover:text-white hover:border-white px-8 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-200"
            >
              SHARE ON
              <TwitterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
} 