# KSTU Care — Smart Web-Based Counseling Platform

Final year project for **Kumasi Technical University**  
**Student:** Cleopas Kwame Obbo (`052241360117`)  
**Programme:** Computer Technology  
**Supervisor:** Dr Emily Opoku Aboagye-Dapaah  

A secure web platform for student counseling access, appointment booking, client tracking, real-time chat, and WebRTC video sessions.

## Features

- Role-based access for **students**, **counselors**, and **admins** (JWT)
- Online appointment booking, approval, cancellation, and completion
- Client profile management and session history tracking
- Real-time chat with Socket.io
- Video counseling with WebRTC via PeerJS
- Admin dashboard for service utilisation monitoring
- In-app notifications for appointment updates

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Real-time chat | Socket.io |
| Video | WebRTC (PeerJS) |
| Auth | JSON Web Tokens (JWT) |

## Project structure

```
kstu-counseling-platform/
├── client/          # React frontend
├── server/          # Express API + Socket.io + PeerJS
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+
- MySQL 8+ is optional (proposal database). The app defaults to **SQLite** so you can run it immediately.

## Setup

### 1. Install dependencies

```bash
cd D:\kstu-counseling-platform
npm run install:all
```

### 2. Seed demo data

```bash
npm run seed
```

By default this creates `server/data/kstu_counseling.db` (SQLite) and demo accounts.

### Optional: MySQL (proposal stack)

1. Start MySQL (Docker: `docker compose up -d`)
2. Set in `server/.env`:

```
DB_DRIVER=mysql
DB_PASSWORD=rootpass
```

3. Run `npm run seed` again.

### 4. Run the app

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173)

## Demo account

Password: `Password123!`

| Role | Email |
|------|-------|
| Student | `cleopas@student.kstu.edu.gh` |

## API overview

- `POST /api/auth/register` — register student/counselor
- `POST /api/auth/login` — login
- `GET /api/appointments` — list appointments
- `POST /api/appointments` — book appointment (student)
- `PATCH /api/appointments/:id/status` — update status
- `GET /api/clients` — client profiles
- `PUT /api/clients/:id` — update client profile
- `POST /api/clients/:id/sessions` — add session note
- `GET /api/chat/conversations` — chat threads
- `GET /api/admin/dashboard` — admin stats
- Socket.io events: `join_conversation`, `send_message`, `new_message`
- PeerJS path: `/peerjs`

## Objectives covered

1. Secure role-based web application  
2. Client management / session tracking module  
3. Online appointment booking with notifications  
4. Real-time chat and video counseling  
5. Ready for usability testing and evaluation  

## Author

Cleopas Kwame Obbo  
Computer Science Department  
Kumasi Technical University  
June 2026
