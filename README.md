# Anonymous Chat API

A real-time, scalable anonymous chat application built with NestJS, PostgreSQL, and Redis.

## Features

- Anonymous user sessions with token-based authentication.
- Real-time messaging using Socket.io.
- Horizontal scalability support via Redis Pub/Sub adapter.
- Strict validation and error handling.

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (with Drizzle ORM)
- **Cache & Pub/Sub:** Redis
- **WebSockets:** Socket.io

## Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd anonymous-chat-api
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/anonymous_chat
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   ```
4. **Run database migrations:**
   ```bash
    npm run migrate
    ```
5. **Start the application:**
   ```bash
    npm run start:dev
    ```