// src/utils/auth.ts
import { Request } from "express";
import { verifyToken } from "@clerk/backend";

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = (req.headers.authorization || "") as string;
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) return null;
  const token = m[1];
  try {
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return (verified && verified.sub) ? String(verified.sub) : null;
  } catch (err: any) {
    console.warn("verifyToken failed:", err?.message ?? err);
    return null;
  }
}
