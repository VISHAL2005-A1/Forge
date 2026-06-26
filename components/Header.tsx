import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkUser } from "@/lib/checkUser";
import { PricingModal } from "@/components/PricingModal";
import { PLANS } from "@/lib/constant";
import type { Plan } from "@/types/plans";

export default async function Header() {
  const user = await checkUser();

  return (
    <header className=" scrollbar-none fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-700 bg-[#0a0a0a]/80 backdrop-blur-xs">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          
<Link href="/" className="flex items-center gap-2 select-none">
<h1 className="text-heading flex items-center text-4xl font-bold tracking-tight">Forge</h1>
</Link> 

        {/* Logo
          <Image
            src="/header.svg"
            alt="Forge"
            width={100}
            height={100}
            className="h-9 w-auto rounded-md"
          />

       

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/projects"
                className="text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                Projects
              </Link>

              <PricingModal>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/70 hover:bg-white/10 transition-colors cursor-pointer">
                  <Zap className="h-3 w-3 fill-white/70" />
                  {user.credits}/{PLANS[user.plan as Plan].credits} credits
                </span>
              </PricingModal>

              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-white/60 hover:text-white hover:bg-transparent transition-colors"
                >
                  Sign in
                </Button>
              </SignInButton>

              <SignInButton mode="modal">
                <Button
                  size="sm"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1a7fd4] hover:bg-[#1a7fd4]/90 px-5 text-sm font-semibold text-white active:scale-95 transition-all"
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}