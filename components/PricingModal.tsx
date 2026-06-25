"use client";

import * as React from "react";
import { useAuth, PricingTable } from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { BlueTitle } from "./reusable";

interface PricingModalProps {
  children: React.ReactNode;
  reason?: "credits" | "upgrade";
}

export function PricingModal({
  children,
  reason = "upgrade",
}: PricingModalProps) {
  const { isSignedIn } = useAuth();

  const title =
    reason === "credits"
      ? "You're out of credits"
      : "Upgrade your plan";

  const description =
    reason === "credits"
      ? "You've used all available credits. Upgrade to continue building."
      : "Choose the plan that best fits your workflow.";

  return (
    <Dialog>
      <DialogTrigger className={"cursor-pointer"}>
        {children}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#0f0f0f] p-0 text-white sm:max-w-5xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-serif text-xl tracking-tight text-white/90">
            <BlueTitle className="text-3xl sm:text-4xl">
              {title}
            </BlueTitle>
          </DialogTitle>

          <DialogDescription className="text-sm text-white/40">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isSignedIn ? (
            <PricingTable
              checkoutProps={{
                appearance: {
                  elements: {
                    drawerRoot: {
                      zIndex: 2000,
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-center text-sm text-white/50">
              Sign in to view available plans.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}