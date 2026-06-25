"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton, PricingTable } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
// import { ArrowRight, Zap, ChevronRight, Check } from "lucide-react";
// import { cn } from "@/lib/utils";
import { GrayTitle, BlueTitle, SectionHeading, SectionLabel } from "@/components/reusable";
import { Badge } from "@/components/ui/badge";
// import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import dynamic from "next/dynamic";
import { Zap } from "lucide-react";
import { ArrowRight } from "lucide-react";

const StarsBackground = dynamic(
  () =>
    import("@/components/animate-ui/components/backgrounds/stars").then(
      (mod) => mod.StarsBackground
    ),
  { ssr: false }
);

// import { CheckoutButton } from "@clerk/nextjs/experimental";
// import { PRICING_PLANS } from "@/lib/constant";
import {
  PLACEHOLDERS,
  SUGGESTIONS, STEPS, FEATURES
} from "@/lib/data";
import HowToUse from "@/components/howToUse";


export default function Home() {

  const { isSignedIn, has } = useAuth();
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);


  useEffect(() => {

    if (isFocused || prompt) return;
    const timer = setInterval(() => {
      setPlaceholderIndex(
        (prev) => (prev + 1) % PLACEHOLDERS.length
      );
    }, 3000);
    return () => clearInterval(timer);
  }, [isFocused, prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(
      `/workspace?prompt=${encodeURIComponent(prompt.trim())}`
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  return (
    <main
      className="
        min-h-screen
        bg-[#0a0a0a]
        selection:bg-white/20
      "
    >
      <section
        className="
          relative
          flex
          min-h-screen
          flex-col
          items-center
          overflow-hidden
          px-4
          pb-24
          pt-32
          text-center
        "
      >
        <StarsBackground
          className="
            absolute
            inset-0
            h-full
            w-full
          "
        />
        <Badge
          variant="outline"
          className="
            z-10
            gap-2
            p-3
            backdrop-blur
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              animate-pulse
              rounded-full
              bg-emerald-400
            "
          />
          Projects coming soon
        </Badge>
        {/* <HowToUse></HowToUse> */}
        <h1
          className="
            z-10
            mt-10
            max-w-4xl
            text-balance
            font-serif
            text-5xl
            leading-tight
            tracking-tight
            sm:text-6xl
            lg:text-7xl
          "
        >
          <GrayTitle>
            Forge your dream
          </GrayTitle>
          <br />
          <BlueTitle>
            from a single prompt..
          </BlueTitle>
          <p
            className="
              mx-auto
              mt-8
              max-w-2xl
              text-lg
              text-gray-300
            "
          >
            Transform your ideas into reality
            with the power of AI.

          </p>

        </h1>

        {/* Prompt Box */}
        <div
          className="
            z-10
            mt-12
            w-full
            max-w-2xl
          "
        >
          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-cyan-500/20
              bg-black/60
              backdrop-blur
              shadow-lg
            "
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                const el = textareaRef.current;
                if (el) {
                  el.style.height = "auto";
                  el.style.height =
                    `${Math.min(el.scrollHeight, 240)}px`;
                }

              }}

              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                PLACEHOLDERS[placeholderIndex]
              }

              className="
                w-full
                resize-none
                overflow-y-auto
                bg-transparent
                px-4
                py-4
                text-sm
                sm:text-base
                leading-relaxed
                text-white
                placeholder:text-white/40
                focus:outline-none
                scrollbar-hide
              "

              style={{
                maxHeight: "240px"
              }}
            />



            <div
              className="
                flex

                flex-col

                gap-3

                border-t
                border-white/10


                px-4

                py-3


                sm:flex-row

                sm:items-center

                sm:justify-between
              "
            >



              <p
                className="
                  text-xs

                  text-white/40
                "
              >

                Press Enter to Generate

              </p>






              {
                isSignedIn ? (

                  <Button

                    onClick={handleSubmit}

                    disabled={!prompt.trim()}


                    className={`
                      h-11

                      w-full
                      sm:w-auto


                      rounded-full


                      px-6


                      font-semibold


                      inline-flex

                      items-center

                      justify-center

                      gap-2


                      transition


                      ${prompt.trim()

                        ?

                        "bg-cyan-500 text-black hover:bg-cyan-400"

                        :

                        "bg-zinc-800 text-zinc-500 cursor-not-allowed"

                      }

                    `}
                  >

                    Generate

                    <ArrowRight
                      className="h-4 w-4"
                    />

                  </Button>


                )


                  :

                  (


                    <SignInButton mode="modal">


                      <Button

                        className="
                        h-11

                        w-full
                        sm:w-auto


                        rounded-full


                        bg-white


                        px-6


                        font-semibold


                        text-black


                        inline-flex

                        items-center

                        justify-center

                        gap-2


                        hover:bg-gray-100

                      "
                      >

                        Sign in to Generate


                        <ArrowRight
                          className="h-4 w-4"
                        />


                      </Button>


                    </SignInButton>


                  )


              }



            </div>


          </div>




          {/* Suggestions */}


          <div
            className="
              mt-4

              flex

              flex-wrap

              justify-center

              gap-2
            "
          >

            {
              SUGGESTIONS.map((item) => (

                <button

                  key={item}

                  onClick={() => handleSuggestion(item)}

                  className="
                    rounded-full

                    border
                    border-white/10

                    bg-white/5

                    px-3

                    py-1.5

                    text-xs

                    text-white/50

                    hover:bg-white/10

                    hover:text-white

                  "
                >

                  {item}

                </button>

              ))
            }


          </div>



        </div>





        <p
          className="
            z-10

            mt-10

            text-xs

            text-white/20
          "
        >

          No credit card required ·
          10 free generations on sign up

        </p>



      </section>

      {/* BROWSER MOCKUP */}
      <section className="px-4 pb-24">
        <div className="
    mx-auto
    max-w-5xl
    overflow-hidden
    rounded-2xl
    border border-white/10
    bg-[#0f0f0f]
    shadow-2xl
  ">

          {/* Browser Header */}
          <div className="
      flex
      items-center
      gap-3
      border-b border-white/10
      px-3
      py-2
    ">

            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-white/20"
                />
              ))}
            </div>

            <div className="
        mx-auto
        flex
        h-6
        w-56
        items-center
        justify-center
        rounded-md
        bg-white/5
      ">
              <span className="text-[11px] text-white/30">
                Forge.app/workspace
              </span>
            </div>

          </div>



          {/* Workspace */}

          <div className="
      grid
      min-h-[420px]
      grid-cols-1
      md:grid-cols-[260px_1fr]
    ">


            {/* Chat */}

            <div className="
        flex
        flex-col
        border-b border-white/10
        bg-[#0d0d0d]
        md:border-b-0
        md:border-r
      ">


              <div className="
          border-b border-white/10
          px-3
          py-2
        ">
                <p className="text-[11px] uppercase text-white/40">
                  Chat
                </p>
              </div>



              <div className="
          flex-1
          space-y-3
          px-3
          py-3
        ">


                {/* User */}

                <div className="flex justify-end">
                  <div className="
              max-w-[85%]
              rounded-xl
              rounded-br-sm
              bg-white/10
              px-3
              py-2
            ">
                    <p className="text-xs text-white/80">
                      Build a kanban board with drag and drop
                    </p>
                  </div>
                </div>



                {/* AI */}

                <div className="flex gap-2">

                  <div className="
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-md
              bg-white
            ">
                    <Zap className="h-3 w-3 fill-black text-black" />
                  </div>


                  <div className="
              rounded-xl
              rounded-tl-sm
              bg-white/5
              px-3
              py-2
            ">
                    <p className="text-xs text-white/60">
                      build a Kanban board with Todo,
                      Progress and Done columns.
                    </p>
                  </div>

                </div>



                {/* Loading */}

                <div className="flex gap-2">

                  <div className="
              flex
              h-6
              w-6
              items-center
              justify-center
              rounded-md
              bg-white
            ">
                    <Zap className="h-3 w-3 fill-black text-black" />
                  </div>


                  <div className="
              flex
              gap-1
              rounded-xl
              bg-white/5
              px-3
              py-2
            ">
                    {[1, 2, 3].map(i => (
                      <span
                        key={i}
                        className="
                    h-1.5
                    w-1.5
                    animate-bounce
                    rounded-full
                    bg-white/40
                  "
                      />
                    ))}
                  </div>

                </div>


              </div>




              {/* Input */}

              <div className="
          border-t border-white/10
          p-2.5
        ">

                <div className="
            flex
            items-center
            rounded-lg
            bg-white/5
            px-3
            py-2
          ">

                  <span className="
              flex-1
              text-xs
              text-white/30
            ">
                    Ask AI to modify...
                  </span>

                  <ArrowRight className="h-3.5 w-3.5 text-white/30" />

                </div>

              </div>


            </div>





            {/* Preview */}

            <div className="flex flex-col bg-[#141414]">


              <div className="
          flex
          border-b border-white/10
        ">

                <button className="
            border-b-2
            border-blue-400
            px-4
            py-2
            text-xs
            text-white
          ">
                  Preview
                </button>


                <button className="
            px-4
            py-2
            text-xs
            text-white/40
          ">
                  Code
                </button>

              </div>




              <div className="
          grid
          flex-1
          grid-cols-3
          gap-2
          p-3
        ">


                {["Todo", "Progress", "Done"].map((col, i) => (

                  <div
                    key={col}
                    className="
                rounded-lg
                bg-white/[0.03]
                p-2
              "
                  >

                    <div className="
                mb-2
                flex
                justify-between
              ">

                      <span className="
                  text-[10px]
                  uppercase
                  text-white/40
                ">
                        {col}
                      </span>

                      <span className="
                  rounded-full
                  bg-white/10
                  px-1.5
                  text-[10px]
                  text-white/40
                ">
                        {3 - i}
                      </span>

                    </div>


                    {Array.from({ length: 3 - i }).map((_, x) => (

                      <div
                        key={x}
                        className="
                    mb-2
                    rounded-md
                    border
                    border-white/10
                    bg-[#1a1a1a]
                    p-2
                  "
                      >

                        <div
                          className="
                      h-1.5
                      rounded-full
                      bg-white/20
                    "
                          style={{
                            width: `${60 + x * 15}%`
                          }}
                        />

                      </div>

                    ))}


                  </div>

                ))}


              </div>


            </div>


          </div>


        </div>
      </section>

      {/* FEATURES */}

      <section className="px-4 pb-24 sm:pb-32 relative -top-25 ">
        <StarsBackground
          className="
            absolute
            
            inset-0
            h-48
            w-full
          "
        />
        <div className="mx-auto mb-10 max-w-3xl text-center relative">

          <SectionLabel>
            Everything you need
          </SectionLabel>

          <SectionHeading
            gray="From prompt"
            blue="to production."
          />

          <p className="mx-auto mt-4 max-w-xl text-sm text-white/40">
            Build, customize, and ship complete applications
            with AI without starting from scratch.
          </p>

        </div>



        <div
          className="
      mx-auto
      grid

      max-w-5xl

      grid-cols-1

      gap-4

      sm:grid-cols-2

      lg:grid-cols-3
    "
        >

          {FEATURES.map(({ icon: Icon, label, desc }) => (

            <div
              key={label}

              className="
          group

          relative

          overflow-hidden

          rounded-2xl

          border
          border-white/10

          bg-[#0d0d0d]

          p-6

          transition-all

          duration-300

          hover:-translate-y-1

          hover:border-blue-400/30

          hover:bg-[#111]
        "
            >


              {/* Glow */}

              <div
                className="
            absolute

            inset-0

            opacity-0

            transition

            duration-300

            group-hover:opacity-100

            bg-linear-to-br

            from-blue-500/10

            via-transparent

            to-transparent
          "
              />



              <div
                className="
            relative
          "
              >


                <div
                  className="
              mb-5

              flex

              h-10

              w-10

              items-center

              justify-center

              rounded-xl

              border

              border-white/10

              bg-white/5

              transition

              group-hover:border-blue-400/40

            "
                >

                  <Icon
                    className="
                h-5

                w-5

                text-white/60

                transition

                group-hover:text-blue-400
              "
                  />

                </div>




                <h3
                  className="
              mb-2

              text-sm

              font-semibold

              text-white
            "
                >

                  {label}

                </h3>



                <p
                  className="
              text-sm

              leading-relaxed

              text-white/40
            "
                >

                  {desc}

                </p>


              </div>


            </div>


          ))}


        </div>

      </section>


      {/* HOW IT WORKS */}

      <section className="px-4 pb-24 sm:pb-32">


        <div className="mx-auto mb-12 max-w-3xl text-center">


          <SectionLabel>
            How it works
          </SectionLabel>


          <SectionHeading
            gray="Idea"
            blue="to application."
          />


          <p
            className="
        mx-auto

        mt-4

        max-w-lg

        text-sm

        text-white/40
      "
          >
            Describe what you want and let AI handle
            the building process.
          </p>


        </div>






        <div
          className="
      mx-auto

      max-w-3xl

    "
        >



          {STEPS.map((step, i) => (


            <div
              key={step.number}

              className="
          flex

          gap-5

          sm:gap-7
        "
            >



              {/* Number */}


              <div
                className="
            flex

            flex-col

            items-center
          "
              >


                <div
                  className="
              flex

              h-10

              w-10

              shrink-0

              items-center

              justify-center


              rounded-full


              border

              border-white/10


              bg-white/5


              shadow-lg
            "
                >

                  <span
                    className="
                font-mono

                text-xs

                font-semibold

                text-white/60
              "
                  >

                    {step.number}

                  </span>


                </div>



                {i !== STEPS.length - 1 && (

                  <div
                    className="
                mt-2

                h-full

                min-h-20

                w-px

                bg-gradient-to-b

                from-white/20

                to-white/5
              "
                  />

                )}


              </div>







              {/* Content */}


              <div
                className="
            pb-10

            pt-1
          "
              >


                <h3
                  className="
              mb-2

              text-sm

              font-semibold

              text-white

              sm:text-base
            "
                >

                  {step.label}

                </h3>



                <p
                  className="
              max-w-xl

              text-sm

              leading-relaxed

              text-white/40
            "
                >

                  {step.desc}

                </p>



              </div>



            </div>


          ))}



        </div>


      </section>

      {/* PRICING */}
      <section className="px-4 pb-32">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Simple pricing</SectionLabel>
          <SectionHeading gray="Start free," blue="scale when ready." />

          <p className="mx-auto mt-4 max-w-sm text-sm text-white/35">
            No credit card required. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
        <PricingTable
        checkoutProps={{
          appearance:{
            elements:{
              drawerRoot:{
                zIndex:2000,
              },
            },
          },
        }}
        />

        </div>

        
      </section>

    </main>

  );
}