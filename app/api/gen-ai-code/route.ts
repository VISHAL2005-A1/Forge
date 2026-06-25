// ============================================================
//  app/api/gen-ai-code/route.ts
//
//  Accepts the exact body WorkspaceClient.tsx sends:
//  {
//    workspaceId: string | null,
//    userId:      string,
//    messages:    Message[],          ← full conversation history
//    fileData:    FileData | null,    ← current files in the editor
//  }
//
//  Returns SSE stream with events:
//    { type: "status",  message: string }
//    { type: "done",    workspaceId, fileData, creditsRemaining, assistantMessage }
//    { type: "error",   message: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAIStream } from "./createAIStream";
import { aiRouter } from "@/lib/ai/router";

// ⚠️  Must be nodejs — Edge runtime can't hold the stateful singleton router
export const runtime = "nodejs";

// ── Types matching WorkspaceClient.tsx ───────────────────────
interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string;
}

interface GenAICodeBody {
  workspaceId: string | null;
  userId: string;
  messages: IncomingMessage[];          // full conversation history
  fileData: Record<string, unknown> | null;
}

// ── POST /api/gen-ai-code ────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: GenAICodeBody;
  try {
    body = await req.json() as GenAICodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workspaceId, userId, messages, fileData } = body;

  // 2. Validate — must have at least one message
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required and must not be empty" },
      { status: 400 }
    );
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // 3. Extract the last user message as the current prompt
  //    Earlier messages become conversation history context
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    return NextResponse.json(
      { error: "No user message found in messages array" },
      { status: 400 }
    );
  }

  // 4. Return an SSE stream — WorkspaceClient reads events line by line
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Status: thinking
        send({ type: "status", message: "Thinking…" });

        // Build the AI request — pass the full conversation so the model
        // has context, but treat the last user message as the active prompt
        const result = await createAIStream({
          messages,        // ← full history including the latest user message
          fileData,        // ← current editor state (used for context in system prompt)
          workspaceId,
          userId,
          onStatus: (msg: string) => send({ type: "status", message: msg }),
        });

        // Status: saving
        send({ type: "status", message: "Saving workspace…" });

        // Done — send final event
        send({
          type: "done",
          workspaceId: result.workspaceId,
          fileData: result.fileData,
          creditsRemaining: result.creditsRemaining,
          assistantMessage: result.assistantMessage,
        });

      } catch (err) {
        const message = (err as Error).message ?? "Unknown error";
        console.error("[/api/gen-ai-code] Error:", message);

        if (message.includes("exhausted")) {
          send({ type: "error", message: "All AI providers are currently unavailable. Please try again later." });
        } else {
          send({ type: "error", message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// ── GET /api/gen-ai-code → provider health check ─────────────
export async function GET() {
  return NextResponse.json({
    status: "ok",
    providers: aiRouter.getStatus(),
  });
}