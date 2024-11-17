"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { generateVerificationToken } from "@/app/actions/verification";

export default function LandingPage() {
  const { connected, publicKey } = useWallet();
  const [hasBackpack, setHasBackpack] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setHasBackpack('backpack' in window);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!publicKey) return;
    
    setIsVerifying(true);
    try {
      await generateVerificationToken(publicKey.toString());
      
      // Call verify endpoint with the userId
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: publicKey.toString() }),
        // The token is now in the cookies, so we don't need to send it explicitly
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  }, [publicKey]);

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
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background image with stars */}
      <div className="absolute inset-0 bg-[url('/stars-bg.jpg')] bg-cover bg-center" />
      
      {/* Wallet Button - Fixed top right */}
      <div className="absolute top-4 right-4 z-20">
        <WalletMultiButton />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-8 flex flex-col items-center justify-center min-h-screen">
        {/* Logo and titles */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold" style={{ color: '#FF4B4B' }}>
            The First Landing
          </h1>
          <h2 className="text-xl md:text-2xl mt-2 text-white">
            An Eclipse Odyssey
          </h2>
        </div>

        {/* Main content area */}
        <div className="w-full max-w-md space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {/* Always show Backpack download */}
            <div className="text-center">
              <p className="mb-2">1- Download Backpack</p>
              <Button 
                onClick={handleInstallBackpack}
                className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-8 py-2 rounded-full"
              >
                Download Backpack
              </Button>
            </div>
            
            <div className="text-center">
              <p className="mb-2">2- CONNECT your wallet below to VERIFY</p>
              {connected && (
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full sm:w-auto bg-[hsl(120,100%,88%)] text-black hover:bg-[hsl(120,100%,78%)] px-8 py-2 rounded-full"
                >
                  {isVerifying ? 'Verifying...' : 'VERIFY'}
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          {connected && (
            <div className="space-y-3 text-center mt-8 px-4">
              <p className="text-sm md:text-base">
                - Bridge over $500 on ETH to Eclipse using the{" "}
                <a href="your-bridge-url" className="text-blue-400 hover:underline">
                  official bridge
                </a>
              </p>
              <p className="text-sm md:text-base">
                - Buy $LAIKA on{" "}
                <a href="https://orca.so" className="text-blue-400 hover:underline">
                  orca.so
                </a>
              </p>
            </div>
          )}

          {/* Share button */}
          <div className="text-center mt-6">
            <Button 
              onClick={handleShareTweet}
              className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-8 py-2 rounded-full"
            >
              SHARE ON X
            </Button>
          </div>
        </div>

        {/* Footer with logos */}
        <div className="absolute bottom-4 w-full px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image 
              src="/backpack-logo.png" 
              alt="Backpack" 
              width={120} 
              height={30}
              className="object-contain"
            />
          </div>
          <div className="text-sm text-gray-400">
            powered by VALIDATORS
          </div>
          <div className="flex items-center space-x-2">
            <Image 
              src="/eclipse-logo.png" 
              alt="Eclipse" 
              width={120} 
              height={30}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </main>
  );
} 