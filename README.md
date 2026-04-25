# Incubator System - Backend

The core API engine for the Incubator Management System, handling student submissions, campaign management, and hybrid authentication.

## 🚀 Technologies
* **Node.js & Express**: Fast, unopinionated web framework.
* **MongoDB & Mongoose**: Flexible NoSQL database for student data and campaign storage.
* **Firebase Admin SDK**: Securely verifies Google ID tokens and handles cloud authentication.
* **JWT (JSON Web Tokens)**: Secure stateless authentication for administrative routes.
* **Discord Webhooks**: Real-time notifications for new student submissions and help requests.

## 🛠 Features
* **Hybrid Auth System**: Supports both standard Email/Password login and Google OAuth via Firebase.
* **Dynamic Form Engine**: Manages campaign start/end dates and custom field configurations.
* **Bangladesh Time Sync**: All submission dates are strictly calculated using `Asia/Dhaka` timezone (12:00 AM to 11:59 PM).
* **Automated Insights**: Aggregates daily update counts and student participation metrics.

## 📂 Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

## 🏃 Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The server will run on `http://localhost:5000`.

## 📡 API Endpoints (Brief)
* `POST /api/admin/login`: Standard credentials login.
* `POST /api/admin/firebase-login`: Google/Firebase token sync.
* `GET /api/forms`: Retrieve all active campaigns.
* `POST /api/submissions`: Public endpoint for student form entry.
* `GET /api/submissions/:formId`: Admin-only submission tracking grid data.
