import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import express from "express";

export const aiMessagesRouter = express.Router();
const prisma = new PrismaClient();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

aiMessagesRouter.get("/", async (req, res) => {
    res.send("AI Messages route is working");
})





