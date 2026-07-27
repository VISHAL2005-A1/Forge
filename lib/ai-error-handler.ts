import { jsonrepair } from "jsonrepair";

export class AIResponseError extends Error { }
export class TruncatedResponseError extends AIResponseError { }
export class InvalidJSONError extends AIResponseError { }
export class MissingAppError extends AIResponseError { }

export function validateResponse(content: string) {
    if (!content?.trim()) {
        throw new AIResponseError("Empty AI response");
    }

    if (!content.includes("{")) {
        throw new InvalidJSONError("No JSON found");
    }

    // NOTE: we intentionally do NOT throw on `!content.trim().endsWith("}")`
    // here anymore. That check was a false-positive magnet — trailing prose
    // after otherwise-valid JSON (common with instruct-tuned models) would
    // trip it even though extractJSON()/parseJSON() below can recover the
    // content fine. Real truncation is now detected downstream in parseJSON,
    // only after both a plain JSON.parse and a jsonrepair-assisted parse
    // have failed.
}

export function parseJSON(content: string) {
    try {
        return JSON.parse(content);
    } catch {
        try {
            return JSON.parse(jsonrepair(content));
        } catch {
            // Both plain parse and repair-assisted parse failed.
            // If the content also doesn't end cleanly, this is very likely
            // genuine truncation — surface that specific, more actionable
            // error instead of a generic "invalid JSON".
            const trimmed = content.trim();
            if (!trimmed.endsWith("}") && !trimmed.endsWith("```")) {
                throw new TruncatedResponseError("Response truncated");
            }
            throw new InvalidJSONError("Invalid JSON");
        }
    }
}

export function validateFiles(
    files: Record<string, unknown>,
    isNewProject: boolean
) {
    if (!files) {
        throw new Error("No files generated");
    }

    if (
        isNewProject &&
        !files["/App.tsx"] &&
        !files["/App.jsx"]
    ) {
        throw new MissingAppError(
            "Missing App.tsx"
        );
    }
}

export function logError(error: unknown) {
    console.error(
        "[AI BUILDER ERROR]",
        error
    );
}

export function getFriendlyMessage(
    error: unknown
) {
    if (
        error instanceof TruncatedResponseError
    ) {
        return "Response was too large. Try a smaller prompt.";
    }

    if (
        error instanceof InvalidJSONError
    ) {
        return "AI generated invalid JSON.";
    }

    if (
        error instanceof MissingAppError
    ) {
        return "Missing App.tsx.";
    }

    return "Unknown generation error.";
}

export async function retry(
    fn: () => Promise<unknown>,
    retries = 2
) {
    let lastError;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError;
}
export function fixReactHooks(
    files: Record<string, { code: string }>
) {
    const hooks = [
        "useState",
        "useEffect",
        "useRef",
        "useMemo",
        "useCallback",
    ];

    for (const file of Object.values(files)) {
        let code = file.code;

        const used = hooks.filter((hook) =>
            code.includes(`${hook}(`)
        );

        if (!used.length) continue;

        if (
            code.includes("from 'react'") ||
            code.includes('from "react"')
        ) {
            const importLine =
                used.join(", ");

            code = code.replace(
                /import React from ['"]react['"]/,
                `import React, { ${importLine} } from 'react'`
            );

            file.code = code;
        }
    }

    return files;
}
export function getErrorFallbackFile(
    message: string
) {
    return {
        "/App.tsx": {
            code: `
export default function App() {
  return (
    <div style={{
      height:'100vh',
      display:'flex',
      justifyContent:'center',
      alignItems:'center',
      background:'#0f0f0f',
      color:'white'
    }}>
      <div>
        <h1>⚠ Generation Failed</h1>
        <p>${message}</p>
      </div>
    </div>
  )
}
`
        }
    };
}