# <p align="center">Treiwo Backend</p>

This repository contains the backend implementation of a social media clone built using Node.js, Express.js, Sequelize, and PostgreSQL. It includes features like JWT authentication, email verification using OTP, and integration with Cloudinary for image storage.

---

## Features

- **JWT Authentication**: Secure user authentication using JSON Web Tokens.
- **Supabase**:for cloud PostgreSQL database .
- **Sequelize**: Promise-based Node.js ORM for PostgreSQL.
- **Cloudinary Image Storage**: Store and manage images efficiently with Cloudinary.
- **Email Verification**: Verify user emails using OTP.

---

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Deejai007/social-media-backend.git

   ```

2. **Install dependencies:**

   ```bash
   cd social-media-backend
   npm install

   ```

3. **Set up environment variables:**

---

## Example `.env` Configuration

```env
PORT=8967

# Database connection string
DATABASE_URL=postgresql://postgres:mysql@localhost:5432/Mybank

# Nodemailer (for sending emails)
m_email=your_email@gmail.com
m_password=your_app_password

# Project name (for email templates, etc.)
pro_name=YourProjectName

# JWT secret
ACCESS_TOKEN_SECRET=your_jwt_secret

# Password reset token expiry (in ms)
RESET_PASSWORD_EXPIRE=36000000

# Cloudinary credentials
cloudinary_cloudname=your_cloudinary_cloudname
cloudinary_apikey=your_cloudinary_apikey
cloudinary_apisecret=your_cloudinary_apisecret

# Set to "true" in production
production=false

# Client URL (frontend)
CLIENT_URL=http://localhost:5173
```

> **Note:**
>
> - Replace all placeholder values with your actual credentials.
> - Never commit your real `.env` file to public

4. **Start the server:**
   ```bash
   node index.js
   ```

---

## API Documentation

This document describes the available API routes for the Express authentication app.

---

### User Routes (`/user`)

| Method | Endpoint                    | Description                     | Auth Required | Body / Params                 |
| ------ | --------------------------- | ------------------------------- | ------------- | ----------------------------- |
| GET    | `/user/getuser/:username`   | Get user profile by username    | Yes           | URL param: `username`         |
| POST   | `/user/register`            | Register new user               | No            | `{ email, password }`         |
| POST   | `/user/verify`              | Verify user email with OTP      | No            | `{ email, otp }`              |
| POST   | `/user/verifysendotp`       | Send OTP for email verification | No            | `{ email }`                   |
| POST   | `/user/login`               | Login user                      | No            | `{ email, password }`         |
| POST   | `/user/forgotpassword`      | Send password reset email       | No            | `{ email }`                   |
| POST   | `/user/forgotresetpassword` | Reset password using token      | No            | `{ token, newPassword }`      |
| POST   | `/user/adduserdata`         | Add/update user profile data    | Yes           | `{ formData: { ...fields } }` |

---

### Follow Routes (`/follow`)

| Method | Endpoint                       | Description                  | Auth Required | Body / Params     |
| ------ | ------------------------------ | ---------------------------- | ------------- | ----------------- |
| POST   | `/follow/sendreq`              | Send follow request          | Yes           | `{ followingId }` |
| POST   | `/follow/acceptreq`            | Accept follow request        | Yes           | `{ followerId }`  |
| POST   | `/follow/rejectreq`            | Reject follow request        | Yes           | `{ followerId }`  |
| POST   | `/follow/unfollow-user`        | Unfollow a user              | Yes           | `{ followingId }` |
| POST   | `/follow/remove-follower`      | Remove a follower            | Yes           | `{ followerId }`  |
| GET    | `/follow/get-pending-requests` | Get pending follow requests  | Yes           | -                 |
| GET    | `/follow/followers`            | Get list of followers        | Yes           | -                 |
| GET    | `/follow/followings`           | Get list of users you follow | Yes           | -                 |

---

### Post Routes (`/post`)

> **Note:** Actual endpoints may vary due to frequent changes. Example endpoints:
>
> | Method | Endpoint        | Description       | Auth Required | Body / Params                  |
> | ------ | --------------- | ----------------- | ------------- | ------------------------------ |
> | POST   | `/post/upload`  | Upload a post     | Yes           | `{ caption, location, media }` |
> | GET    | `/post/:postId` | Get a single post | Yes           | URL param: `postId`            |
> | GET    | `/post/`        | Get all posts     | Yes           | -                              |
> | DELETE | `/post/:postId` | Delete a post     | Yes           | URL param: `postId`            |
> | POST   | `/post/like`    | Like a post       | Yes           | `{ postId }`                   |
> | POST   | `/post/unlike`  | Unlike a post     | Yes           | `{ postId }`                   |

---

# Authentication

- Most protected routes require a valid JWT token in cookies (see `getAccessToRoute` middleware).
- All endpoints return JSON responses.
- Error responses follow the format:  
  `{ success: false, message: "Error message" }`

---

# Example Error Response

```json
{
  "success": false,
  "message": "Invalid Credentials"
}
```

For detailed API endpoints and usage, refer to the [API Documentation](API_DOCUMENTATION.md).

---

### Contributing

Contributions are welcome! Please fork the repository and submit pull requests to contribute.

---

### License

This project is licensed under the [MIT License](LICENSE).
