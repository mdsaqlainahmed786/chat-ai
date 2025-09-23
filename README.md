# Chat-AI

A modern **real-time chat application** with **AI assistant integration**, built with **React, Node.js, Prisma, Socket.IO, and Clerk authentication**. It supports **1:1 and group conversations**, AI-powered responses, and rich messaging features like image/audio sharing. The project also includes **production-grade monitoring** using Prometheus and Grafana Cloud.

<img width="1900" height="911" alt="image" src="https://github.com/user-attachments/assets/b2054587-6f2f-4d87-9d4b-8c28aeab2466" />

---

##  Features

### User Authentication

* User authentication & management via **Clerk**.
* Secure token verification for all socket and REST API events.

###  Real-Time Chat

* **1:1 and group conversations**.
* **Real-time messaging** using **Socket.IO**.
* **All the Essential Modern Chat Features**.
* Invite URL based system for advanced **Privacy**, So you choose who you want to **talk to**

###  AI Assistant

* Trigger AI responses by typing `@AI` or `@ai`.
* Dedicated **AI conversation room**.
* AI messages are **streamed in real-time** for a ChatGPT-like experience.
* All the participants in a group or 1:1 chats, Can see the **The Real AI stream responses for their queries**

###  Media Sharing

* **Image uploads** inside chat.
* **Audio messages** (record, preview, and send).
* Live recording with the browser’s **MediaRecorder API**.

###  Monitoring & Metrics

* **Prometheus metrics endpoint** (`/metrics`) exposed from the backend.
* Integrated with **Grafana Cloud** for dashboards.
* Tracks request counts, active connections, and custom application metrics for every interval.
  
  <img width="1671" height="835" alt="Screenshot 2025-09-21 164733" src="https://github.com/user-attachments/assets/a510d4ca-5f24-48ae-b6b3-65c30ccb1a8f" />


###  Tech Stack

* **Frontend**: React (Vite + TypeScript), Tailwind CSS, shadcn/ui.
* **Backend**: Node.js, Express, Prisma, Socket.IO.
* **Database**: PostgreSQL.
* **Auth**: Clerk.
* **Monitoring**: Prometheus + Grafana Cloud.
* **Deployment**: Render (backend), production-ready Docker setup.

---

##  Getting Started

### Prerequisites

* Node.js & npm
* Docker & Docker Compose
* PostgreSQL

### Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/your-username/chat-ai.git
   cd chat-ai
   ```

2. Configure environment variables for backend & frontend (`.env`).

3. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Run with Docker Compose:

   ```bash
   docker-compose up --build
   ```

5. Frontend runs at: `http://localhost:5173`
   Backend runs at: `http://localhost:3000`
   Prometheus at: `http://localhost:9090`

---

 **Need a hands on walktrough, Just Go for it**: https://chat-ai-six-xi.vercel.app 

##  Author

Made by mdsaqlainahmed786 ;)

---
