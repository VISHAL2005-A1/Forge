// ============================================================
//  app/api/gen-ai-code/createAIStream.ts
// ============================================================
import path from "path";
import { aiRouter } from "@/lib/ai/router";
import { AIMessage } from "@/lib/ai/types";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  validateResponse,
  parseJSON,
  logError,
  getFriendlyMessage,
  getErrorFallbackFile,
  fixReactHooks
} from "@/lib/ai-error-handler";

// ── Types ─────────────────────────────────────────────────────
interface CreateAIStreamOptions {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    imageUrl?: string;
  }>;
  fileData: Record<string, unknown> | null;
  workspaceId: string | null;
  userId: string;
  onStatus?: (msg: string) => void;
}

interface AIStreamResult {
  workspaceId: string;
  fileData: Record<string, unknown>;
  creditsRemaining: number;
  assistantMessage: string;
  provider: string;
  model: string;
}

// ── Allowed packages in Sandpack ──────────────────────────────
const ALLOWED_PACKAGES = new Set([
  "react", "react-dom", "react-router-dom", "recharts",
  "framer-motion", "lucide-react", "date-fns", "uuid",
  "clsx", "classnames", "tailwind-merge", "zustand",
]);

// ── All lucide icons the AI commonly uses ─────────────────────
const LUCIDE_ICONS = new Set([
  "Activity", "AlertCircle", "AlertTriangle", "Archive", "ArrowDown", "ArrowLeft",
  "ArrowRight", "ArrowUp", "Award", "BarChart", "BarChart2", "BarChart3", "Bell",
  "Bookmark", "Box", "Briefcase", "Calendar", "Camera", "Check", "CheckCircle",
  "CheckSquare", "ChevronDown", "ChevronLeft", "ChevronRight", "ChevronUp",
  "Circle", "Clock", "Cloud", "Code", "Code2", "Columns", "Command", "Compass",
  "Contact", "Copy", "CreditCard", "Database", "Download", "Edit", "Edit2", "Edit3",
  "ExternalLink", "Eye", "EyeOff", "File", "FileText", "Filter", "Flag", "Folder",
  "FolderOpen", "Gauge", "Gift", "Globe", "Grid", "Hash", "Heart", "HelpCircle",
  "Home", "Image", "Info", "Key", "Laptop", "Layout", "LayoutDashboard", "Link",
  "List", "Loader", "Loader2", "Lock", "LogIn", "LogOut", "Mail", "Map", "MapPin",
  "Maximize", "Menu", "MessageCircle", "MessageSquare", "Mic", "Minus", "Monitor",
  "Moon", "MoreHorizontal", "MoreVertical", "Music", "Package", "Package2", "Pause",
  "Pencil", "Phone", "Play", "Plus", "PlusCircle", "Power", "RefreshCw", "Save",
  "Search", "Send", "Settings", "Share", "Share2", "Shield", "ShoppingCart", "Sidebar",
  "Sliders", "Star", "Sun", "Table", "Tag", "Terminal", "Trash", "Trash2", "TrendingUp",
  "TrendingDown", "Unlock", "Upload", "User", "UserCheck", "UserPlus", "Users",
  "Video", "Wallet", "X", "XCircle", "Zap", "ZoomIn", "ZoomOut", "FolderPlus",
  "FilePlus", "FileCode", "FileJson", "Layers", "PieChart", "LineChart", "AreaChart",
  "Cpu", "Server", "Wifi", "Bluetooth", "Battery", "BatteryCharging", "Smartphone",
  "Tablet", "Watch", "Headphones", "Speaker", "Volume", "Volume1", "Volume2",
  "VolumeX", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest", "Github",
  "Gitlab", "Boxes", "Container", "Boxes", "LayoutGrid", "LayoutList", "SidebarOpen",
  "SidebarClose", "PanelLeft", "PanelRight", "ChevronFirst", "ChevronLast",
  "ChevronsLeft", "ChevronsRight", "ChevronsUp", "ChevronsDown", "MoveLeft",
  "MoveRight", "MoveUp", "MoveDown", "Navigation", "Navigation2", "Compass",
  "Route", "Map", "MapPin", "Pin", "Crosshair", "Target", "Aperture", "Focus",
  "ScanLine", "Scan", "QrCode", "Barcode", "Receipt", "FileSpreadsheet",
  "FileBarChart", "FileBarChart2", "FilePieChart", "FileLineChart", "Presentation",
  "GanttChart", "KanbanSquare", "Trello", "ClipboardList", "Clipboard",
  "ClipboardCheck", "ClipboardCopy", "ClipboardPaste", "ClipboardSignature",
  "BookOpen", "Book", "BookMarked", "Bookmark", "BookText", "BookType", "Library",
  "GraduationCap", "School", "Microscope", "FlaskConical", "TestTube", "Atom",
  "Binary", "Braces", "Brackets", "Hash", "Variable", "Function", "Pi", "Sigma",
  "Infinity", "Percent", "Divide", "Minus", "Plus", "X", "Equal", "CornerDownLeft",
  "CornerDownRight", "CornerLeftDown", "CornerLeftUp", "CornerRightDown",
  "CornerRightUp", "CornerUpLeft", "CornerUpRight", "Undo", "Undo2", "Redo", "Redo2",
]);

// ─────────────────────────────────────────────────────────────
//  System prompt
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(fileData: Record<string, unknown> | null): string {
  const hasExistingCode = fileData && Object.keys(fileData).length > 0;

  return `You are an elite React developer and UI/UX designer at a top-tier product studio.
Your code is always production-quality, visually stunning, and feels like a real SaaS product.

${hasExistingCode
      ? `Existing files: ${JSON.stringify(Object.keys(fileData ?? {}))}.
Modify only what is needed. Preserve structure.`
      : `Generate a brand new React application from scratch.`
    }

ALLOWED IMPORTS — use ONLY these packages, nothing else:
- react, react-dom, react-router-dom
- recharts (for charts/graphs)
- framer-motion (for animations)
- lucide-react (for ALL icons — import as named exports e.g. import { Home, Settings } from 'lucide-react')
- date-fns, uuid, clsx, classnames, tailwind-merge, zustand

NEVER import from: @mui, @chakra-ui, antd, @headlessui, @radix-ui, @heroicons,
react-icons, axios, lodash, moment, styled-components, @emotion, react-spring,
@tanstack, @react-spring, or ANY package not listed above.

IMPORT RULES (critical):
- Every component, hook, icon, or utility you USE must be explicitly imported.
- Never use a name in JSX without first importing it at the top of that file.
- Icons: ALWAYS import every icon used e.g. import { Home, Folder, BarChart2 } from 'lucide-react'
- React hooks: import { useState, useEffect, useRef } from 'react' — never assume they are global.
- Inter-file imports: use relative paths e.g. import Sidebar from './components/Sidebar'
IMPORTANT:
- Maximum 4 files total.
- Use only:
  /App.tsx
  /components/Sidebar.tsx
  /components/Dashboard.tsx
  /components/Contact.tsx
- Keep code concise.
- Do not generate unnecessary components.
- Reuse components whenever possible.
DESIGN RULES:
- Dark theme: background #0f0f0f or #0a0a0a, cards #1a1a1a or #161616
- Accent: purple (#7c3aed), blue (#3b82f6), or green (#10b981) — pick one
- Type hierarchy: text-xs labels, text-2xl+ headings
- Cards: rounded-xl, shadow-lg, p-6, hover states
- Every clickable element: hover:opacity-80 or hover:bg-white/10 transitions
- All data: realistic mock values — never "Artist 1", "Song 1", "User Name"

COMPONENT RULES:
- Multiple files: /App.tsx + /components/*.tsx
- TypeScript interfaces for all data shapes
- Recharts: style tooltips, remove grey backgrounds, use accent colors



OUTPUT — respond with ONLY this JSON, no markdown fences, no explanation:
{
  "title": "App title",
  "files": {
    "/App.tsx": { "code": "..." },
    "/components/Sidebar.tsx": { "code": "..." }
  },
  "dependencies": { "react": "^18.0.0","react-dom": "^18.0.0","react-router-dom": "^6.0.0",' },
  "assistantMessage": "Brief description of what was built"
}`


}

// ─────────────────────────────────────────────────────────────
//  POST-PROCESSOR 1 — strip disallowed package imports
// ─────────────────────────────────────────────────────────────
function sanitizeImports(
  files: Record<string, { code: string }>
): Record<string, { code: string }> {
  const importRegex = /^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]\s*;?/gm;
  const result: Record<string, { code: string }> = {};

  for (const [path, fileObj] of Object.entries(files)) {
    // Guard: skip files with no code or non-string code
    if (!fileObj || typeof fileObj.code !== "string") {
      result[path] = { code: "" };
      continue;
    }

    let code = fileObj.code;
    const stripped: string[] = [];

    code = code.replace(importRegex, (fullMatch, clause, pkg) => {
      const root = pkg.startsWith("@")
        ? pkg.split("/").slice(0, 2).join("/")
        : pkg.split("/")[0];

      // Relative imports and allowed packages: keep as-is
      if (root.startsWith(".") || ALLOWED_PACKAGES.has(root)) return fullMatch;

      stripped.push(root);
      return makeStub(clause, root);
    });

    if (stripped.length > 0) {
      console.warn(`[sanitizer] Stubbed in ${path}:`, [...new Set(stripped)]);
    }

    result[path] = { code };
  }

  return result;
}

function makeStub(clause: string, pkg: string): string {
  const lines = [`// [stub] '${pkg}' unavailable in sandbox`];
  const def = clause.match(/^(\w+)$/);
  const ns = clause.match(/^\*\s+as\s+(\w+)$/);
  const named = clause.match(/^\{([^}]+)\}$/);
  const mixed = clause.match(/^(\w+)\s*,\s*\{([^}]+)\}$/);

  const parseNames = (s: string) =>
    s.split(",").map((x) => x.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean);

  if (def) lines.push(`const ${def[1]} = ({children,...p}:any)=>children??null;`);
  else if (ns) lines.push(`const ${ns[1]} = new Proxy({},{get:()=>()=>null});`);
  else if (named) parseNames(named[1]).forEach((n) => lines.push(`const ${n}=(..._:any[])=>null;`));
  else if (mixed) {
    lines.push(`const ${mixed[1]} = ({children,...p}:any)=>children??null;`);
    parseNames(mixed[2]).forEach((n) => lines.push(`const ${n}=(..._:any[])=>null;`));
  } else {
    lines.push(`// could not stub: import ${clause} from '${pkg}'`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  POST-PROCESSOR 2 — inject missing lucide-react imports
// ─────────────────────────────────────────────────────────────
function fixLucideImports(
  files: Record<string, { code: string }>
): Record<string, { code: string }> {
  const result: Record<string, { code: string }> = {};

  for (const [path, fileObj] of Object.entries(files)) {
    if (!fileObj || typeof fileObj.code !== "string") {
      result[path] = { code: "" };
      continue;
    }

    let code = fileObj.code;

    // 1. Collect already-imported lucide names
    const imported = new Set<string>();
    const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    let m: RegExpExecArray | null;
    while ((m = lucideRe.exec(code)) !== null) {
      m[1].split(",").forEach((s) => {
        const name = s.trim().split(/\s+as\s+/)[0].trim();
        if (name) imported.add(name);
      });
    }

    // 2. Find icons used in JSX but not imported
    const missing = new Set<string>();
    for (const icon of LUCIDE_ICONS) {
      const alreadyImportedAnywhere = new RegExp(
        `import\\s+.*\\b${icon}\\b.*from`
      ).test(code);

      if (alreadyImportedAnywhere) continue;
      // <IconName  or  <IconName/  or  <IconName>
      if (new RegExp(`<${icon}[\\s/>]`).test(code)) missing.add(icon);
    }

    if (missing.size > 0) {
      const line = `import { ${[...missing].sort().join(", ")} } from "lucide-react";`;
      // Insert after the last import line
      const allImports = [...code.matchAll(/^import\s.+$/gm)];
      const last = allImports.pop();
      if (last?.index !== undefined) {
        const at = last.index + last[0].length;
        code = code.slice(0, at) + "\n" + line + code.slice(at);
      } else {
        code = line + "\n" + code;
      }
      console.log(`[lucide-fixer] Injected in ${path}:`, [...missing]);
    }

    result[path] = { code };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
//  POST-PROCESSOR 3 — inject missing CSS files
// ─────────────────────────────────────────────────────────────
function fixMissingCssFiles(
  files: Record<string, { code: string }>
): Record<string, { code: string }> {
  const appCode = files["/App.tsx"]?.code ?? files["/App.jsx"]?.code ?? "";

  if (appCode.includes("./App.css") && !files["/App.css"]) {
    files["/App.css"] = { code: "body { margin: 0; padding: 0; font-family: sans-serif; }" };
  }
  if (appCode.includes("./index.css") && !files["/index.css"]) {
    files["/index.css"] = { code: "" };
  }

  return files;
}

// ─────────────────────────────────────────────────────────────
//  POST-PROCESSOR 4 — fix cross-file undefined imports
//  If file A does `import Foo from './components/Foo'` but /components/Foo.tsx
//  doesn't exist in the generated files, stub it so Sandpack doesn't 404.
// ─────────────────────────────────────────────────────────────
function fixMissingLocalFiles(
  files: Record<string, { code: string }>
): Record<string, { code: string }> {
  const relativeImportRe = /from\s+['"](\.[^'"]+)['"]/g;

  // Normalise file paths: ensure they start with /
  const knownPaths = new Set(
    Object.keys(files).map((p) => (p.startsWith("/") ? p : `/${p}`))
  );

  // Extensions Sandpack will try in order
  const exts = [".tsx", ".ts", ".jsx", ".js"];

  const resolve = (from: string, rel: string): string | null => {
    const dir = from.split("/").slice(0, -1).join("/") || "/";
    // Very simple resolver — not a full bundler but handles ./foo and ../foo
    const parts = `${dir}/${rel}`.split("/");
    const resolved: string[] = [];
    for (const p of parts) {
      if (p === "..") resolved.pop();
      else if (p !== ".") resolved.push(p);
    }
    const base = "/" + resolved.join("/");
    if (knownPaths.has(base)) return base;
    for (const ext of exts) {
      if (knownPaths.has(base + ext)) return base + ext;
    }
    // Also try index
    for (const ext of exts) {
      const idx = base + "/index" + ext;
      if (knownPaths.has(idx)) return idx;
    }
    return null;
  };

  const stubs: Record<string, { code: string }> = {};

  for (const [filePath, fileObj] of Object.entries(files)) {
    if (!fileObj?.code) continue;
    let m: RegExpExecArray | null;
    const re = new RegExp(relativeImportRe.source, "g");
    while ((m = re.exec(fileObj.code)) !== null) {
      const rel = m[1];
      if (resolve(filePath, rel)) continue; // file exists — fine

      // File is missing — create a stub
      const dir = filePath.split("/").slice(0, -1).join("/") || "/";
      const parts = `${dir}/${rel}`.split("/");
      const resolved: string[] = [];
      for (const p of parts) {
        if (p === "..") resolved.pop();
        else if (p !== ".") resolved.push(p);
      }
      const stubPath = path.posix
        .normalize("/" + resolved.join("/") + ".tsx");
      if (!files[stubPath] && !stubs[stubPath]) {
        const componentName = resolved[resolved.length - 1]
          .replace(/[^a-zA-Z0-9]/g, "") || "Stub";
        stubs[stubPath] = {
          code: `// [auto-stub] '${rel}' was imported but not generated\nexport default function ${componentName}() { return null; }\n`,
        };
        console.warn(`[missing-file-fixer] Stubbed missing file: ${stubPath}`);
      }
    }
  }

  return { ...files, ...stubs };
}

// ─────────────────────────────────────────────────────────────
//  JSON extraction
// ─────────────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  const trimmed = raw.trim();

  // 1. Already valid JSON
  try { JSON.parse(trimmed); return trimmed; } catch { /* fall through */ }

  // 2. ```json ... ``` or ``` ... ```
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    try { JSON.parse(inner); return inner; } catch { return inner; }
  }

  // 3. First { … last }
  const s = trimmed.indexOf("{");
  const e = trimmed.lastIndexOf("}");
  if (s !== -1 && e > s) return trimmed.slice(s, e + 1);

  return trimmed;
}

// ─────────────────────────────────────────────────────────────
//  Run all post-processors in order
// ─────────────────────────────────────────────────────────────
function postProcess(
  files: Record<string, { code: string }>
): Record<string, { code: string }> {
  // Ensure every entry has a string code property
  const safe: Record<string, { code: string }> = {};
  for (const [k, v] of Object.entries(files)) {
    safe[k] = { code: typeof v?.code === "string" ? v.code : "" };
  }

  let f = fixMissingCssFiles(safe);   // 1. inject App.css / index.css
  f = sanitizeImports(f);             // 2. stub bad package imports
  f = fixLucideImports(f);            // 3. inject missing lucide icon imports
  f = fixMissingLocalFiles(f);        // 4. stub missing relative-import files
  const normalized: Record<string, { code: string }> = {};

  for (const [k, v] of Object.entries(f)) {
    const clean = "/" + k.replace(/^\/+/, "");

    normalized[clean] = v;
  }

  return normalized;
  return f;
}

// ─────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────
export async function createAIStream(
  options: CreateAIStreamOptions
): Promise<AIStreamResult> {
  const { messages, fileData, workspaceId, onStatus } = options;

  onStatus?.("Analyzing your request…");

  const aiMessages: AIMessage[] = messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({
      role: m.role,
      content: m.imageUrl ? `${m.content}\n[Image: ${m.imageUrl}]` : m.content,
    }));

  onStatus?.("Generating with AI…");

  const workspaceContext =
    fileData && Object.keys(fileData).length
      ? `\nCURRENT FILES:\n${JSON.stringify(fileData, null, 2)}\nReturn the FULL updated JSON.\n`
      : "";

  const aiResponse = await aiRouter.generate({
    messages: aiMessages,
    systemPrompt: buildSystemPrompt(fileData) + "\n\n" + workspaceContext,
    maxTokens: 6000,
    temperature: 0.7,
  });

validateResponse(
  aiResponse.content
);
  onStatus?.("Processing response…");
  console.log("Length:", aiResponse.content.length);

  console.log(
    "Ends with brace:",
    aiResponse.content.trim().endsWith("}")
  );

  // ── Parse JSON ──────────────────────────────────────────────
  let parsedResponse: {
    title?: string;
    files?: Record<string, { code: string }>;
    dependencies?: Record<string, string>;
    assistantMessage?: string;
  };



  const response = aiResponse.content.trim();

  if (
    !response.endsWith("}") &&
    !response.endsWith("```")
  ) {
    throw new Error(
      "AI response was truncated before completion"
    );
  }

  try {
  validateResponse(aiResponse.content);

  const jsonCandidate = extractJSON(
    aiResponse.content
  );

  parsedResponse = parseJSON(
    jsonCandidate
  ) as {
    title?: string;
    files?: Record<string, { code: string }>;
    dependencies?: Record<string, string>;
    assistantMessage?: string;
  };

} catch (error) {

  logError(error);

  return {
    workspaceId: workspaceId ?? "error",

    fileData: {
      title: "Generation Failed",
      files: getErrorFallbackFile(
        getFriendlyMessage(error)
      ),
      dependencies: {},
    },

    creditsRemaining: 0,

    assistantMessage:
      getFriendlyMessage(error),

    provider: "system",
    model: "fallback",
  };
}

  // ── Post-process files ──────────────────────────────────────
  onStatus?.("Validating code…");

  const rawFiles = parsedResponse.files ?? {};

let files = postProcess(rawFiles);

// Fix missing React hook imports
files = fixReactHooks(files);

console.log("Generated files:");
console.log(Object.keys(files));

if (!files["/App.tsx"] && !files["/App.jsx"]) {
  throw new Error("AI did not return /App.tsx");
}
  // ── Persist to DB ───────────────────────────────────────────
  onStatus?.("Saving workspace…");

  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthenticated");

  let dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, credits: true },
  });

  if (!dbUser) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? `${clerkId}@unknown.dev`;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "Anonymous";

    dbUser = await db.user.create({
      data: { clerkId, name, email, imageUrl: clerkUser.imageUrl ?? "", credits: 10, plan: "free" },
      select: { id: true, credits: true },
    });
    console.log(`[createAIStream] Auto-created DB user for clerkId: ${clerkId}`);
  } console.log(
    "FINAL FILES:",
    Object.keys(files)
  );

  const fileDataToSave = {
    title: parsedResponse.title ?? "Generated App",
    files,
    dependencies: parsedResponse.dependencies ?? {},
  };

  const messagesJson = aiMessages as unknown as import("@/lib/generated/prisma/client").Prisma.JsonArray;

  const savedWorkspace = await db.workspace.upsert({
    where: { id: workspaceId ?? "__new_workspace__" },
    create: {
      userId: dbUser.id,
      title: parsedResponse.title ?? "Generated App",
      fileData: fileDataToSave,
      messages: messagesJson,
    },
    update: {
      title: parsedResponse.title ?? "Generated App",
      fileData: fileDataToSave,
      messages: messagesJson,
      updatedAt: new Date(),
    },
  });

  const creditsRemaining = Math.max(0, dbUser.credits - 2);
  await db.user.update({
    where: { id: dbUser.id },
    data: { credits: creditsRemaining },
  });

  return {
    workspaceId: savedWorkspace.id,
    fileData: fileDataToSave,
    creditsRemaining,
    assistantMessage:
      parsedResponse.assistantMessage ??
      `Generated using ${aiResponse.provider} (${aiResponse.model})`,
    provider: aiResponse.provider,
    model: aiResponse.model,
  };
}