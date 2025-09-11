import dotenv from "dotenv"
dotenv.config()
import { clerkMiddleware } from "@clerk/express"
import express from "express"
import cors from "cors"

import { authRouter } from "./auth"
import { chatRouter } from "./chat"
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

app.get("/", (req, res) => {
    res.send("Hello world")
})



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})