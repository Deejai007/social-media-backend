# <p align="center">Social Media Clone Backend</p>

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

   ```bash
   DATABASE_URL=your_db_url
   PORT=8967
   # nodemailer
   m_email=nodemailer_mail
   m_password=nodemailer_app_password
   # jwt secret
   ACCESS_TOKEN_SECRET=_jwt_secret
   # cloudinary
   cloudinary_cloudname=your_cloud_name
   cloudinary_apikey=your_api_key
   cloudinary_apisecret=your_api_secret

   ```

4. **Start the server:**
   ```bash
   node index.js
   ```

---

### API Documentation

For detailed API endpoints and usage, refer to the [API Documentation](API_DOCUMENTATION.md).

---

### Contributing

Contributions are welcome! Please fork the repository and submit pull requests to contribute.

---

### License

This project is licensed under the [MIT License](LICENSE).
