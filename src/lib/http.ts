import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { ledger } from "./ledger";

export class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}

export function requireSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(req.url).origin;
  if ((origin && origin !== expected) || req.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "This request must come from the Retrace website.");
  }
}

export function limitRequests(req: Request, scope: string, limit = 30, identity?: string) {
  // Behind a proxy, only trust forwarding headers set by your hosting ingress.
  const client = identity || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const bucket = createHash("sha256").update(`${scope}:${client}`).digest("hex");
  const result = ledger().allow(bucket, limit, 60_000);
  if (!result.allowed) throw new HttpError(429, "Too many requests. Please wait before trying again.", result.retryAfter);
}

export async function readJson(req: Request, maximumBytes = 16_384): Promise<unknown> {
  if (!req.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Send application/json.");
  if (Number(req.headers.get("content-length")) > maximumBytes) throw new HttpError(413, "Request too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximumBytes) { await reader.cancel(); throw new HttpError(413, "Request too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "Invalid JSON."); }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) return Response.json({ error: error.message }, {
    status: error.status, headers: { "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) },
  });
  if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message || "Invalid input." }, { status: 400 });
  // Server log only (never sent to the client): the message is needed to diagnose upstream failures.
  console.error("Retrace request failed:", error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error");
  return Response.json({ error: "The service could not complete this request. Please retry." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
