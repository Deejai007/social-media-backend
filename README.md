# Treiwo Backend

This repository contains the backend of Treiwo - a social media platform - built with Node.js, Express.js, Sequelize, and PostgreSQL. Includes JWT auth, email OTP, Cloudinary, Redis/BullMQ background jobs, and real-time chat via Spring WebSocket microservice (ChatMS).

---

## Services Overview

When run via Docker Compose, 5 containers start together:

| Container | Description                             | Port     |
| --------- | --------------------------------------- | -------- |
| app       | Node.js auth/API server                 | **8967** |
| worker    | Background job processor (BullMQ)       | none     |
| redis     | Job queue and cache                     | **6379** |
| postgres  | Primary PostgreSQL database             | **5432** |
| chatms    | Spring Boot WebSocket chat microservice | **5679** |

---

## Features

- JWT Authentication (cookie + Bearer header fallback)
- PostgreSQL + Sequelize ORM
- Redis + BullMQ background jobs (emails, notifications)
- Cloudinary image upload and storage
- Email OTP verification on register
- Real-time WebSocket chat via ChatMS (port 5679)

---

## Installation

```bash
git clone https://github.com/Deejai007/social-media-backend.git
cd social-media-backend
npm install
node index.js
```

---

## Docker Compose (Recommended)

Both repos must be cloned as siblings:

```
Projects/
+-- auth/     <- this repo
+-- chatms/   <- Spring chat microservice
```

```bash
docker-compose up -d --build   # start all 5 services
docker-compose down            # stop all
```

---

## .env Configuration

```env
PORT=8967
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth
m_email=your_email@gmail.com
m_password=your_app_password
pro_name=Treiwo
ACCESS_TOKEN_SECRET=your_jwt_secret
RESET_PASSWORD_EXPIRE=36000000
cloudinary_cloudname=your_cloudname
cloudinary_apikey=your_apikey
cloudinary_apisecret=your_apisecret
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auth
CLIENT_URL=http://localhost:5173
production=false
BREVO_API_KEY=your brevo api key
```

> Never commit real credentials to version control.

---

## API Routes

### Base URL: http://localhost:8967

### User Routes (/user)

| Method | Endpoint                  | Description             | Auth |
| ------ | ------------------------- | ----------------------- | ---- |
| GET    | /user/getuser/:username   | Get profile by username | Yes  |
| GET    | /user/search?query=       | Search users            | Yes  |
| POST   | /user/register            | Register new user       | No   |
| POST   | /user/verify              | Verify email OTP        | No   |
| POST   | /user/verifysendotp       | Resend OTP              | No   |
| POST   | /user/login               | Login                   | No   |
| POST   | /user/forgotpassword      | Send reset email        | No   |
| POST   | /user/forgotresetpassword | Reset password          | No   |
| POST   | /user/adduserdata         | Update profile          | Yes  |

### Follow Routes (/follow)

| Method | Endpoint                     | Description           | Auth |
| ------ | ---------------------------- | --------------------- | ---- |
| POST   | /follow/sendreq              | Send follow request   | Yes  |
| POST   | /follow/acceptreq            | Accept follow request | Yes  |
| POST   | /follow/rejectreq            | Reject follow request | Yes  |
| POST   | /follow/unfollow-user        | Unfollow              | Yes  |
| POST   | /follow/remove-follower      | Remove follower       | Yes  |
| GET    | /follow/get-pending-requests | Pending requests      | Yes  |
| GET    | /follow/followers            | Followers list        | Yes  |
| GET    | /follow/followings           | Followings list       | Yes  |

### Post Routes (/post)

| Method | Endpoint      | Description     | Auth |
| ------ | ------------- | --------------- | ---- |
| POST   | /post/upload  | Upload post     | Yes  |
| GET    | /post/:postId | Get single post | Yes  |
| GET    | /post/        | Get all posts   | Yes  |
| DELETE | /post/:postId | Delete post     | Yes  |
| POST   | /post/like    | Like post       | Yes  |
| POST   | /post/unlike  | Unlike post     | Yes  |

---

## ChatMS - Real-time WebSocket Chat

**Port: 5679**

Separate Spring Boot microservice. Connect:

```
ws://localhost:5679/chat?userId=<userId>
```

Send (JSON text frame):

```json
{ receiver: 456, content: Hello, messageType: PRIVATE }
```

See ../chatms/README.md for full docs.

---

## Response Format

Success: { success: true, data: {} }
Error: { success: false, message: Error message }

---

## Contributing

Fork and submit a pull request.

---

## License

MIT
