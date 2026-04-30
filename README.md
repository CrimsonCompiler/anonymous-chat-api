# Anonymous Chat API

A real-time, highly scalable anonymous chat application built with NestJS, PostgreSQL, Redis, and Socket.io. 

## Features
- Anonymous user sessions with JWT authentication.
- Real-time messaging and broadcasting using Socket.io.
- Redis Pub/Sub integration for horizontal WebSocket scaling.
- Strict DTO validations and global error handling.

## Tech Stack
- **Framework:** NestJS
- **Database:** PostgreSQL (with Drizzle ORM)
- **Cache & Message Broker:** Redis
- **WebSockets:** Socket.io

---

## 🚀 Local Setup Instructions

Follow these steps to get the project running on your local machine.

### Prerequisites
Make sure you have the following installed:
- Node.js (v18 or higher)
- PostgreSQL
- Redis Server (Running locally on port 6379) or a Redis instance you can connect to. 
- Docker is also an option for both PostgreSQL and Redis.

### 1. Clone the repository
```bash
git clone https://github.com/CrimsonCompiler/anonymous-chat-api.git
cd anonymous-chat-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following configurations:
```env
PORT=3000
DATABASE_URL=postgres://<username>:<password>@localhost:5432/<database_name>
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Run Database Migrations (Drizzle)
Push your schema to the PostgreSQL database:
```bash
npm run db:push
```

### 5. Start the Application
Start the NestJS development server:
```bash
npm run start:dev
```
The server will start running at `http://localhost:3000`.

---

## 🧪 Postman Testing Guide

This comprehensive guide will help you test all HTTP endpoints and WebSocket events using Postman.

### A. HTTP API Endpoints

**Base URL:** `http://localhost:3000/api/v1`

#### 1. Login / Create User
- **Method:** `POST`
- **Endpoint:** `/login`
- **Body (JSON):**
  ```json
  {
    "username": "tasrik"
  }
  ```
- **Action:** Save the `token` from the response. You will need it for the Authorization header in the next requests.

#### 2. Create a Room
- **Method:** `POST`
- **Endpoint:** `/rooms`
- **Headers:** `Authorization: Bearer <your_token_here>`
- **Body (JSON):**
  
```json
  {
    "name": "backend-squad"
  }
  ```

#### 3. Get All Rooms
- **Method:** `GET`
- **Endpoint:** `/rooms`
- **Headers:** `Authorization: Bearer <your_token_here>`

#### 4. Send a Message
- **Method:** `POST`
- **Endpoint:** `/rooms/:roomId/messages` *(Replace `:roomId` with a valid room ID)*
- **Headers:** `Authorization: Bearer <your_token_here>`
- **Body (JSON):**
  ```json
  {
    "content": "Hello team, testing from Postman!"
  }
  ```

#### 5. Get Messages (with Pagination)
- **Method:** `GET`
- **Endpoint:** `/rooms/:roomId/messages?limit=10` *(Replace `:roomId` with a valid room ID)*
- **Headers:** `Authorization: Bearer <your_token_here>`

#### 6. Delete a Room
- **Method:** `DELETE`
- **Endpoint:** `/rooms/:roomId` *(Replace `:roomId` with a valid room ID)*
- **Headers:** `Authorization: Bearer <your_token_here>`
- **Note:** Only the room creator can delete the room.

---

### B. WebSocket (Socket.io) Testing

You can test real-time events using Postman's **WebSocket / Socket.io** feature.

#### 1. Connection Setup
1. Open a new request tab in Postman and select **Socket.io**.
2. **URL:** `ws://localhost:3000/chat`
3. Go to the **Params** (or Handshake) tab and add the following query parameters:
   - `token`: `<your_valid_token>`
   - `roomId`: `<valid_room_id_you_want_to_join>`
4. Click **Connect**. 
   - *If the token is invalid, it will disconnect immediately with a `401` error.*
   - *If the room doesn't exist, it will disconnect with a `404` error.*

#### 2. Listen to Server Events (Server -> Client)
Go to the **Events** tab in your Postman Socket interface and add the following listeners to watch for incoming data:

| Event Name | Description |
| :--- | :--- |
| `room:joined` | Emitted only to you upon successful connection. Contains `{ "activeUsers": ["user1", "user2"] }`. |
| `message:new` | Broadcasted when anyone in the room sends a message via the HTTP POST endpoint. |
| `room:user_left` | Broadcasted to the room when another user disconnects or leaves. |
| `room:deleted` | Broadcasted if the room creator deletes the room. Your socket will automatically disconnect. |

#### 3. Emit Client Events (Client -> Server)
To test user disconnection, you can manually emit an event to the server.
- Go to the **Message** section in Postman Socket UI.
- Set the Event Name to: `room:leave`
- Select **None** or leave the body empty (No payload is required).
- Click **Send**.
- *Expected Result: The server will remove you from the Redis active users list, broadcast `room:user_left` to others, and disconnect your socket.*

---


**Maintained by:** Tousif Tasrik