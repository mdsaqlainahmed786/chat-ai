import dotenv from "dotenv"
dotenv.config()
import { clerkMiddleware } from "@clerk/express"
import express from "express"
import cors from "cors"
import { authRouter } from "./auth.js"
const app = express()

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware({
  // allow requests even without audience
  authorizedParties: undefined
}));
const PORT = process.env.PORT || 3000
app.use("/auth", authRouter)

app.get("/", (req, res) => {
    res.send("Hello world")
})



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})