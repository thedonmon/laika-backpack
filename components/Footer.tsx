import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="w-full px-4 py-6 bg-black/30 backdrop-blur-sm border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="https://backpack.app" target="_blank">
            <Image 
              src="/assets/backpack.png" 
            alt="Backpack" 
            width={120} 
            height={30}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          powered by{" "}
          <Link href="https://validators.wtf" target="_blank">
            <Image 
              src="/assets/validatorswordmark.png" 
            alt="VALIDATORS" 
            width={100} 
            height={20}
            className="object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="https://www.eclipse.xyz" target="_blank">
          <Image 
            src="/assets/eclipse.png" 
            alt="Eclipse" 
            width={120} 
            height={30}
            className="object-contain"
            />
          </Link>
        </div>
      </div>
    </div>
  );
} 