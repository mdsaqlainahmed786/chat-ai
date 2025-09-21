import dotenv from "dotenv";
dotenv.config();
import { clerkMiddleware } from "@clerk/express";
import express from "express";
import http from "http";
import client from 'prom-client';
import cors from "cors";
import { initSocketServer } from "../socket";
import { authRouter } from "./auth";
import { chatRouter } from "./chat";
import { aiMessagesRouter } from "./aiMessages";
import { register } from "prom-client";
import { requestCounter, getActiveGauge, httpDurationMiddleware, onlineUsersGauge, httpDuringMilliSeconds } from "../monitoring/requestCounter";
// import { metricsMiddleware } from "../metricsMiddleware";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
  })
);
app.use(requestCounter);
app.use(getActiveGauge);
app.use(httpDurationMiddleware);
register.registerMetric(httpDuringMilliSeconds);
register.registerMetric(onlineUsersGauge);    
app.use(express.json());
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
app.use(
  clerkMiddleware({
    authorizedParties: undefined,
  })
);


const PORT = process.env.PORT || 3000;
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/ai", aiMessagesRouter);


const server = http.createServer(app);
const io = initSocketServer(server);
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
