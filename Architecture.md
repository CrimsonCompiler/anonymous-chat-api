## Anonymous Chat API Flow Diagram

<img src="https://i.imgur.com/pc3aTjL.png" />
<br>
<img src="https://i.imgur.com/xo8Eglu.png" />
<br>
<img src="https://i.imgur.com/4mxnLhW.png" />
<br>
<img src="https://i.imgur.com/CUO5LBT.png" />


## Session Strategy

Imagine you are visiting an exclusive VIP Club. Here is how the security works:

1. **The Digital Pass (Token)**: When you arrive at reception, the manager gives you a digital wristband. This is your JWT Token.

2. **The Bouncer’s Guestlist (Storage)**: The manager immediately tells the bouncer, "Redis," to write your wristband ID in his guestlist. Redis is lightning-fast because he keeps his list in his hand (Memory) rather than a filing cabinet (Database).

3. **The Door Check (Validation)**: Every time you try to enter a room, the bouncer checks his list.

    - If your ID is there: You get in. (OK)

    - If it’s not: You are blocked. (Unauthorized)

4. **The Magic Ink (Expiry)**: The bouncer writes with "Magic Ink." Exactly 24 hours later, your name vanishes from his list automatically (Redis TTL). Even if you still have the wristband, you can’t get in because your name is gone. You must go back to reception to get a new one.

## WebSocket Fan-out via Redis Pub/Sub

**The Problem:** Imagine your chat app becomes so popular that you need **3 separate server buildings (Instances)** to handle all the users. If User A (connected to Building 1) sends a message, only the users inside Building 1 will receive it. Users in Building 2 and 3 will never see the message because the buildings are not connected to each other.

**The Solution (Redis Pub/Sub):** To fix this, we place a giant **Radio Tower (Redis)** in the middle of all the buildings.

Here is how the "Fan-out" magic works in 3 simple steps:

1.  **Publish (Sending the News):** When User A sends a message, Building 1 doesn't just keep the message to itself. It instantly **"Publishes"** (transmits) that message to the central Redis Radio Tower.
    
2.  **Subscribe (Tuned In):** All the server buildings (Building 1, 2, and 3) are **"Subscribed"** to this Radio Tower. They are constantly listening to it like a radio channel.
    
3.  **Fan-out (The Broadcast):** The moment the Redis Tower receives the message, it instantly broadcasts it to all the listening buildings.
    
4.  **Delivery:** Buildings 2 and 3 receive the broadcasted message from Redis and immediately push it down to their own local users using WebSockets.
    

**The Result:** Because of this Redis Fan-out, even if 10,000 users are scattered across 50 different server instances, everyone receives the exact same chat message at the exact same millisecond!



## Estimated Concurrent User Capacity
A single basic instance (let's say our instance have 512MB RAM) can handle **2,000 to 5,000 concurrent WebSocket connections**.

My Reasoning:
-   **Low Memory Footprint:** Each active WebSocket connection only consumes about 30KB to 50KB of RAM.
    
-   **Non-blocking I/O:** Node.js is incredibly efficient at handling asynchronous tasks. It can rapidly pass messages back and forth without blocking the main thread.
    
-   **Offloaded Heavy Lifting:** We outsourced the most CPU-heavy tasks like session validation and message fan-out to **Upstash Redis**, and data storage to **Neon PostgreSQL**. This keeps our NestJS server's CPU completely free to just handle connections.

## I think doing this will scale the server 10x

-   **Add More Servers (Compute):** Instead of running the app on just one computer (instance), we will run it on multiple computers at the same time. A "Load Balancer" will act like a traffic police, sending new users to whichever computer is the least busy.
    
-   **Share the Database Load (Database):** We will create "Read Replicas" (copies) of our database. We will use the main database only for saving new messages, and use the copies just for reading old messages. This stops the database from freezing under pressure.
    
-   **Upgrade Redis (Pub/Sub):** Instead of using just one Redis server to broadcast all the messages, we will upgrade to a "Redis Cluster" (a team of Redis servers working together). This ensures messages are delivered instantly, even if thousands of users are chatting at once.

## Limitations

1.  **Network Latency:** Using external cloud databases (Upstash/Neon) adds slight network delay compared to a fully internalized server network (VPC).
    
2.  **No Offline Queue:** WebSockets are "fire-and-forget". If a user briefly disconnects, they will miss live messages and must fetch history manually.
    
3.  **Single Point of Failure:** If Upstash Redis goes down, both user authentication and real-time messaging will instantly fail.
    
4.  **Volatile Identity:** Since chat is anonymous, identity is entirely tied to the JWT in local storage. If cleared, the user's identity is permanently lost.