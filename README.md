# Parabondhu API

Express and MongoDB REST API for Parabondhu, a community event platform.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/events` | Public | Upcoming events, with `search`, `type` and `limit` queries |
| GET | `/events/:id` | Public | Event details and participant count |
| GET | `/events/mine` | JWT | Events created by the logged-in user |
| POST | `/events` | JWT | Create an event |
| PUT | `/events/:id` | JWT, owner | Update an event |
| DELETE | `/events/:id` | JWT, owner | Delete an event and its joins |
| GET | `/events/:id/join-status` | JWT | Check whether the user joined |
| POST | `/events/:id/join` | JWT | Join an event |
| GET | `/joins/mine` | JWT | Joined events, sorted by event date |

Protected routes expect `Authorization: Bearer <token>`. Tokens are issued by BetterAuth on the client and verified against its JWKS endpoint.
