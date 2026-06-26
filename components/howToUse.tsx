"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { GrayTitle } from "./reusable";

export default function HowToUse() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-22 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-white shadow-lg transition hover:bg-purple-700"
      >
        <HelpCircle size={20} />
        Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111] p-6 text-white shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold">
                <GrayTitle>Forge Guide</GrayTitle>
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-zinc-800"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-8">

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  1. Describe What You Want
                </h3>

                <div className="rounded-xl bg-zinc-900 p-4">
                  <p className="text-green-400 font-medium">
                    ✅ Good Prompt
                  </p>

                  <p className="mt-2 text-zinc-300">
                    Create a modern web developer portfolio with
                    hero section, projects, skills, contact form,
                    dark theme and responsive design.
                  </p>
                </div>

                <div className="mt-3 rounded-xl bg-zinc-900 p-4">
                  <p className="text-red-400 font-medium">
                    ❌ Bad Prompt
                  </p>

                  <p className="mt-2 text-zinc-300">
                    Make a website.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  2. Modify Existing Apps
                </h3>

                <div className="rounded-xl bg-zinc-900 p-4 text-zinc-300">
                  Keep all existing code.
                  Only redesign the dashboard page.

                  <br />
                  <br />

                  Do not change the current layout.
                  Add a testimonials section below projects.
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  3. Avoid Huge Requests
                </h3>

                <div className="rounded-xl bg-zinc-900 p-4">
                  <p className="text-red-400">
                    ❌ Create Netflix + YouTube + Chat App + Admin Panel
                  </p>

                  <hr className="my-4 border-zinc-700" />

                  <p className="text-green-400">
                    ✅ Step 1: Authentication
                  </p>

                  <p className="text-green-400">
                    ✅ Step 2: Dashboard
                  </p>

                  <p className="text-green-400">
                    ✅ Step 3: Analytics
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  4. If Generation Fails
                </h3>

                <ul className="list-disc space-y-2 pl-5 text-zinc-300">
                  <li>Prompt is too large.</li>
                  <li>AI returned invalid JSON.</li>
                  <li>Response was truncated.</li>
                  <li>Required files were missing.</li>
                </ul>

                <div className="mt-4 rounded-xl bg-zinc-900 p-4 text-zinc-300">
                  Try a shorter prompt or generate features one at a time.
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  5. Example Prompts
                </h3>

                <div className="space-y-3">

                  <div className="rounded-xl bg-zinc-900 p-4">
                    <p className="font-medium text-purple-400">
                      Portfolio Website
                    </p>

                    <p className="mt-2 text-zinc-300">
                      Create a modern web developer portfolio with hero,
                      skills, projects, experience and contact section.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-900 p-4">
                    <p className="font-medium text-purple-400">
                      SaaS Dashboard
                    </p>

                    <p className="mt-2 text-zinc-300">
                      Create a SaaS analytics dashboard with sidebar,
                      charts, metrics cards and responsive design.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-900 p-4">
                    <p className="font-medium text-purple-400">
                      E-Commerce
                    </p>

                    <p className="mt-2 text-zinc-300">
                      Create a modern e-commerce landing page with
                      products grid and shopping cart UI.
                    </p>
                  </div>

                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xl font-semibold">
                  6. Best Practices
                </h3>

                <div className="rounded-xl bg-zinc-900 p-4">
                  <ul className="space-y-2 text-zinc-300">
                    <li>✅ Be specific</li>
                    <li>✅ Mention colors</li>
                    <li>✅ Mention sections</li>
                    <li>✅ Mention responsiveness</li>
                    <li>✅ Mention animations</li>
                    <li>❌ Dont request 20 pages at once</li>
                    <li>❌ Dont use extremely long prompts</li>
                  </ul>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}