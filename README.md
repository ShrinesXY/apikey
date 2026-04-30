# AZPKEY — API Key Management System

> since 2025 | azpkey.biz.id

Professional API key management system built with Node.js, Express, MongoDB, and vanilla JS.

---

## 📁 Project Structure

```
azpkey/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── tiers.js           # Tier definitions (Free/Pro/Premium)
│   ├── controllers/
│   │   ├── authController.js  # Register, login, me
│   │   ├── keyController.js   # Key CRUD, stats, logs
│   │   └── adminController.js # Admin operations
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + adminOnly
│   │   └── apiKeyMiddleware.js # x-api-key validation + rate limiting
│   ├── models/
│   │   ├── User.js            # User schema with bcrypt
│   │   ├── ApiKey.js          # API key schema with virtuals
│   │   └── Log.js             # Request log schema (30d TTL)
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── keys.js            # /api/keys/*
│   │   ├── admin.js           # /api/admin/*
│   │   └── data.js            # /api/data (protected demo endpoints)
│   ├── swagger/
│   │   └── config.js          # Swagger/OpenAPI config
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/
    └── public/
        ├── index.html         # Landing page
        ├── css/
        │   └── style.css      # Global dark theme styles
        ├── js/
        │   ├── main.js        # Landing page JS
        │   └── api.js         # Shared API client + utilities
        └── pages/
            ├── login.html     # Login page
            ├── register.html  # Register page
            ├── dashboard.html # User dashboard (keys, chart, logs)
            ├── admin.html     # Admin panel
            └── docs.html      # API documentation
```

---

## 🚀 Setup & Running

### 1. Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 2. Backend Setup

```bash
cd azpkey/backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev    # development with nodemon
# or
npm start      # production
```

### 3. Environment Variables (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/azpkey
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
ADMIN_SECRET=azpkey_admin_bootstrap_secret
```

### 4. Frontend

The frontend is served automatically by Express from `/frontend/public`.
Just visit `http://localhost:5000` after starting the backend.

---

## 🔑 API Key Usage

### Making requests to protected endpoints

```bash
# Basic request
curl https://azpkey.biz.id/api/data \
  -H "x-api-key: azp_your64charkey"

# Ping / health check
curl https://azpkey.biz.id/api/data/ping \
  -H "x-api-key: azp_your64charkey"
```

### Response format

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-04-22T10:00:00.000Z",
    "keyOwner": "johndoe",
    "tier": "pro",
    "remaining": 49850,
    "usageCount": 150,
    "requestLimit": 50000
  }
}
```

---

## 👑 Admin Setup

After registering your first account, make it admin:

```bash
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "azpkey_admin_bootstrap_secret",
    "userId": "YOUR_USER_ID_FROM_REGISTER_RESPONSE"
  }'
```

Then access the admin panel at `/pages/admin.html`.

---

## 📊 Tier Limits

| Tier    | Requests/month | Rate limit  | Max keys |
|---------|---------------|-------------|----------|
| Free    | 1,000         | 10 req/sec  | 2        |
| Pro     | 50,000        | 60 req/sec  | 10       |
| Premium | 500,000       | 300 req/sec | 50       |

---

## 🔒 Security Features

- **bcrypt** password hashing (12 rounds)
- **JWT** authentication (7-day expiry)
- **Helmet** security headers
- **express-mongo-sanitize** NoSQL injection protection
- **Global rate limiting** — 500 req/15min per IP
- **Auth rate limiting** — 20 attempts/15min per IP
- **Per-key rate limiting** — tier-based req/sec
- **IP whitelist** — restrict keys to specific IPs
- **Input validation** via express-validator

---

## 📖 API Documentation

- **Swagger UI**: `http://localhost:5000/api/docs`
- **Docs page**: `/pages/docs.html`

---

## 🌐 Deployment (Production)

### Environment
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/azpkey
JWT_SECRET=minimum_32_char_random_secret_here
```

### PM2 (recommended)
```bash
npm install -g pm2
cd backend
pm2 start server.js --name azpkey
pm2 startup
pm2 save
```

### Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name azpkey.biz.id;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

Built with ❤️ — AZPKEY since 2025
