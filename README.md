# Evolix — Microblogging Platform (NT208.Q24)

A Twitter-like microblogging web application built as a course project for **NT208 — Web Application Development**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | NestJS 11 + TypeORM + MySQL |
| Real-time | Socket.IO (WebSocket gateway) |
| Caching | Redis (`cache-manager-redis-yet`) |
| Auth | JWT (Bearer token) + bcrypt |
| File storage | Multer disk storage (`/uploads`) |

---

## Project Structure

```
DoAn_NT208.Q24/
├── Evolix/              # React frontend (port 3000)
└── Evolix_backend/      # NestJS backend  (port 4001)
```

---

## Prerequisites

- Node.js >= 18
- MySQL 8
- Redis 7

---

## Setup

### 1. Backend

```bash
cd Evolix_backend
npm install
```

Create a `.env` file (or set environment variables):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=<user_name>
DB_PASSWORD=<user_password>
DB_NAME=evolix_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

The backend starts on **http://localhost:4001**.  
`synchronize: true` is enabled — TypeORM creates/updates tables automatically on startup.

### 2. Frontend

```bash
cd Evolix
npm install
npm run dev
```

The frontend starts on **http://localhost:3000**.  
Vite proxies `/api` → `localhost:4001` and `/uploads` → `localhost:4001/uploads`.

---

## Features

| Feature | Status |
|---|---|
| Register / Login / Logout | ✅ |
| Post tweets (text + image + video) | ✅ |
| Follow / Unfollow users | ✅ |
| Personal news feed (following-based) | ✅ |
| For-You feed (engagement-ranked) | ✅ |
| Like tweets | ✅ |
| Retweet | ✅ |
| Comments / Replies | ✅ |
| Bookmarks | ✅ |
| Notifications | ✅ |
| Direct messages (WebSocket) | ✅ |
| Explore / Search | ✅ |
| Change display name / email / password / username | ✅ |
| Profile picture & header upload | ✅ |
| Real-time push via WebSocket | ✅ |
| Redis caching layer | ✅ |

---

## Performance Design

### Requirement: feed response < 500 ms, support ≥ 10 000 users

**Database indexes** (`tweet` table):
- Composite index `(userId, createdAt)` — fast timeline fan-out queries
- Single index `userId` — fast per-user tweet lookup

**Cached counters** — `likeCount` and `commentCount` columns are incremented in-place; no expensive `COUNT(*)` joins on hot paths.

**Redis caching** — personal feed is cached per user for 60 seconds.  
Cache is invalidated automatically when:
- The user or anyone they follow posts a new tweet
- A retweet is created

**WebSocket** — Socket.IO gateway pushes `new_tweet` events to all online followers in real time so clients can refetch without polling.

---

## Load Testing

### Step 1 — Seed 10 000 users

```bash
cd Evolix_backend
node seed-10k.mjs
```

This inserts 10 000 users, ~30 000 tweets, and ~100 000 follow relationships.  
Runtime: ~10–15 seconds. Safe to run locally — total data is only a few MB.

> To reset: `DELETE FROM follow; DELETE FROM tweet; DELETE FROM user WHERE username LIKE 'seed_user_%';`

### Step 2 — Install k6

```bash
# Windows
winget install k6 --source winget

# macOS
brew install k6
```

Or download the binary from [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/).

### Step 3 — Get a JWT token

1. Open the app at `http://localhost:3000`
2. Log in with any account
3. Open DevTools → Application → Local Storage → `evolix.auth.session`
4. Copy the `token` value

### Step 4 — Run the load test

```bash
cd Evolix_backend
k6 run -e TOKEN=<your_jwt_token> load-test.js
```

**Test profile:** ramps to 100 concurrent virtual users over 50 seconds, then ramps down.

**Pass criteria** (enforced by k6 thresholds):
- `p(95) < 500 ms` — 95th-percentile feed response under 500 ms
- `error rate < 1%`

**Expected results with Redis warm:**

```
http_req_duration: avg=~40ms  p(95)=~150ms  p(99)=~300ms  ✓
http_req_failed:   rate=0.00%                              ✓
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Current user info |
| PATCH | `/auth/password` | Change password |
| PATCH | `/auth/email` | Change email |
| PATCH | `/auth/handle` | Change username |
| GET | `/tweets/feed` | Personal feed (`?scope=for-you` for ranked feed) |
| POST | `/tweets` | Create tweet (multipart/form-data) |
| GET | `/tweets/:id` | Tweet detail + comments |
| POST | `/tweets/:id/like` | Like / unlike |
| GET | `/users/profile/:handle` | Public profile |
| PATCH | `/users/me/profile` | Update profile |
| POST | `/users/me/upload` | Upload profile image |
| POST | `/follows/:id` | Follow user |
| DELETE | `/follows/:id` | Unfollow user |

Full WebSocket events are handled by the Socket.IO gateway at `ws://localhost:4001`.  
Connect with `{ auth: { token: "<jwt>" } }`.

---

## Docker (optional)

```bash
cd Evolix_backend
docker-compose up -d
```

This starts MySQL + Redis containers locally. Update `.env` to use `DB_HOST=mysql` and `REDIS_HOST=redis` if running the backend inside Docker as well.