import dotenv from "dotenv"
dotenv.config()
import { clerkMiddleware } from "@clerk/express"
import express from "express"
import http from "http";
import cors from "cors"
import { initSocketServer } from "../socket";
import { authRouter } from "./auth"
import { chatRouter } from "./chat"
import { aiMessagesRouter } from "./aiMessages"
const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Authorization"]
}));

app.use(express.json())
app.use(clerkMiddleware({
  authorizedParties: undefined
}));
const PORT = process.env.PORT || 3000
app.use("/auth", authRouter)
app.use("/chat", chatRouter)
app.use("/ai", aiMessagesRouter)

const server = http.createServer(app);
const io = initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})