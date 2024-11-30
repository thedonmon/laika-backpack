"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { CheckCircle2 } from 'lucide-react';
import TwitterX from '@/public/assets/twitter-x.svg'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CampaignEndedModal } from "@/components/CampaignEndedModal";

export default function LandingPage() {
  const { connected, publicKey, wallet } = useWallet();
  const [connectedAdapter, setConnectedAdapter] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [bridgeCompleted, setBridgeCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userStatus, setUserStatus] = useState<{
    userExists: boolean;
    hasBackpack: boolean;
    isVerified: boolean;
    bridge: {
      status: 'none' | 'pending' | 'partial' | 'complete';
      message: string;
      usdValue: number;
    };
    laika: {
      hasAccount: boolean;
      balance: number;
    };
  } | null>(null);
  const [showEndedModal, setShowEndedModal] = useState(false);

  useEffect(() => {
    if (!connected) {
      setProgress(0);
      return;
    }

    let currentProgress = 0;

    // Step 1: Backpack connected (25%)
    if (connectedAdapter === 'Backpack') {
      currentProgress += 25;
    }

    // Step 2: Verified (25%)
    if (isVerified) {
      currentProgress += 25;
    }

    // Step 3: Bridge completed (50%) - only count if meets requirement
    if (userStatus?.bridge.status === 'complete' && userStatus.bridge.usdValue >= 490) {
      currentProgress += 50;
    }

    setProgress(currentProgress);
  }, [connected, connectedAdapter, isVerified, userStatus]);

  useEffect(() => {
    if (wallet && connected) {
      setConnectedAdapter(wallet.adapter.name);
    }
    else {
      setConnectedAdapter(null);
    }
  }, [wallet, connected]);

  useEffect(() => {
    async function loadUserData() {
      if (!publicKey) return;

      try {
        const response = await fetch(`/api/user/${publicKey.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setUserStatus(data.verification);
          setIsVerified(data.verification.isVerified);
          setBridgeCompleted(data.verification.bridge.status === 'complete');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }

    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && !isVerified) {
      setShowEndedModal(true);
    }
  }, [connected, isVerified]);

  // const handleVerify = useCallback(async () => {
  //   if (!publicKey || !signMessage) return;

  //   setIsVerifying(true);
  //   try {
  //     // Create message to sign
  //     const timestamp = Date.now();
  //     const message = `Verify wallet ownership for Eclipse Odyssey\nWallet: ${publicKey.toString()}\nTimestamp: ${timestamp}`;
  //     const messageBytes = new TextEncoder().encode(message);

  //     // Get signature
  //     const signature = await signMessage(messageBytes);

  //     // Generate verification token
  //     await generateVerificationToken(publicKey.toString(), bs58.encode(signature));

  //     const response = await fetch('/api/verify', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         userId: publicKey.toString(),
  //         signature: bs58.encode(signature),
  //         message: Buffer.from(messageBytes).toString('base64'),
  //         timestamp: timestamp
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       toast.error('Verification failed');
  //       throw new Error('Verification failed');
  //     }

  //     // Update verification states based on response
  //     setIsVerified(true);
  //     setBridgeCompleted(data.bridgeCompleted || false);
  //     toast.success('Verification successful');
  //   } catch (error) {
  //     toast.error('Verification failed');
  //     console.error('Verification error:', error);
  //   } finally {
  //     setIsVerifying(false);
  //   }
  // }, [publicKey, signMessage]);

  const handleShareTweet = () => {
    const tweetText = encodeURIComponent(
      `I just landed on @EclipseFND with @laikaoneclipse in my @Backpack, ready to ECLIPSE EVERYTHING.
Join the Quest, get rewards: firstlanding.laika.is 
#AnEclipseOdyssey`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const handleInstallBackpack = () => {
    window.open('https://www.backpack.app/', '_blank');
  };

  return (
    <>
      <main className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
        {/* Background image */}
        <div className="fixed inset-0 w-full h-full">
          <Image
            src="/assets/background.jpg"
            alt="Space background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
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
            <h3 className="text-2xl text-gray-300 font-light">
              Embark on an expedition to Eclipse to claim your LAIKA rewards.
            </h3>
          </div>

          {/* Cards section */}
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Steps with Progress */}
            <Progress
              value={progress}
              className="w-full h-2 mb-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              style={{
                '--progress-background': 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                '--progress-glow': '0 0 8px rgba(34, 197, 94, 0.3)'
              } as React.CSSProperties}
            />

            <div className="space-y-4">
              {/* Step 1 */}
              <Card className={`border transition-all duration-200 ${connectedAdapter === 'Backpack' ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
                }`}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${connectedAdapter === 'Backpack' ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                    {connectedAdapter === 'Backpack' ? (
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    ) : (
                      <span className="text-white">1</span>
                    )}
                  </div>
                  <CardTitle className="text-white">Download Backpack & Connect your Eclipse wallet</CardTitle>
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
                  <Card className={`border transition-all duration-200 ${bridgeCompleted ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
                    }`}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-white">2</span>
                      </div>
                      <CardTitle className="text-white">Bridge Assets</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      {userStatus?.userExists ? (
                        // Show user-specific bridge status if we have user data
                        <>
                          <p className="text-gray-300">
                            {userStatus.bridge.message}
                          </p>
                          {userStatus.bridge.status === 'partial' && (
                            <p className="text-yellow-400 mt-2">
                              Current bridge amount: ${userStatus.bridge.usdValue.toFixed(2)}
                            </p>
                          )}
                          <a
                            href="https://app.eclipse.xyz/bridge"
                            className="text-blue-400 hover:underline block mt-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Go to bridge
                          </a>
                        </>
                      ) : (
                        // Show default message if no user data exists yet
                        <p className="text-gray-300">
                          Bridge over $500 on ETH to Eclipse using the{" "}
                          <a
                            href="https://app.eclipse.xyz/bridge"
                            className="text-blue-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            official bridge
                          </a>
                        </p>
                      )}

                    </CardContent>
                  </Card>

                  <Card className={`border transition-all duration-200 ${isVerified ? 'border-green-500 bg-black/50' : 'border-gray-700 bg-black/30'
                    }`}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                        {isVerified ? (
                          <CheckCircle2 className="w-5 h-5 text-black" />
                        ) : (
                          <span className="text-white">3</span>
                        )}
                      </div>
                      <CardTitle className="text-white">Connect & Verify</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      {connected ? (
                        <>
                          <Button
                            disabled={true}
                            className="bg-gray-500 text-black px-8 py-2 rounded-full cursor-not-allowed"
                          >
                            Campaign Ended
                          </Button>
                        </>
                      ) : (
                        <div className="text-gray-400 italic">
                          Please connect your wallet using the button above
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
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

          {/* Add this before the Footer */}
          <div className="w-full max-w-md mx-auto mt-12 mb-24">
            <h2 className="text-2xl font-semibold text-center mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-gray-700">
                <AccordionTrigger className="text-left">
                  What is The First Landing?
                </AccordionTrigger>
                <AccordionContent>
                  The First Landing is a special campaign by Eclipse, Backpack, and Laika where elligible participants may be entitled to a share of Laika rewards!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-gray-700">
                <AccordionTrigger className="text-left">
                  How much do I need to bridge?
                </AccordionTrigger>
                <AccordionContent>
                  You need to bridge at least $500 worth of ETH from Ethereum to Eclipse using the official Eclipse bridge to qualify for rewards. The campaign started on November 20th, 2024 so any bridges on or after that date will count.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-gray-700">
                <AccordionTrigger className="text-left">
                  Why do I need Backpack wallet?
                </AccordionTrigger>
                <AccordionContent>
                  Backpack wallet is the recommended wallet for Eclipse ecosystem. It provides the best user experience and is required to participate in The First Landing campaign.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-gray-700">
                <AccordionTrigger className="text-left">
                  How long does verification take?
                </AccordionTrigger>
                <AccordionContent>
                  {`You only need to verify ONCE! While verification is instant, your bridge transaction might take up to 15 minutes to be indexed in our system. 
                  Don't worry if you verify and don't see your bridge amount right away - we continuously reindex all transactions and will update everyone's stats automatically. 
                  There's no need to verify multiple times (you can if you'd like), as we'll catch all qualifying bridge transactions in our final calculation.`}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </main>
      <CampaignEndedModal 
        open={showEndedModal} 
        onOpenChange={setShowEndedModal}
      />
    </>
  );
} 