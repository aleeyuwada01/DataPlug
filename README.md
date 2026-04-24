# DataPlug - Premium Data & Airtime Utility

A high-end mobile application for data and airtime management, built with React Native (Expo) and a Node.js/Express backend.

## 🚀 Deployment Guide

### 1. Backend Deployment (Render)

The project includes a `render.yaml` file for automated deployment.

1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com) and create a new **Blueprint**.
3.  Select your GitHub repository.
4.  Render will automatically detect the configuration in `render.yaml`.
5.  In the Render Dashboard, manually add the following **Environment Variables** (from your `server/.env`):
    - `DATABASE_URL` (Your Neon connection string)
    - `FLUTTERWAVE_PUBLIC_KEY`
    - `FLUTTERWAVE_SECRET_KEY`
    - `FLUTTERWAVE_ENCRYPTION_KEY`
    - `TERMII_API_KEY`
6.  Once deployed, your backend will be live at `https://your-app-name.onrender.com`.

### 2. Frontend Deployment (EAS)

1.  Update `services/api.ts`:
    ```typescript
    const PROD_BASE = "https://your-app-name.onrender.com"; 
    ```
2.  Install EAS CLI: `npm install -g eas-cli`
3.  Login: `eas login`
4.  Configure: `eas build:configure`
5.  Build for Android: `eas build -p android --profile production`
6.  Build for iOS: `eas build -p ios --profile production`

### 3. Flutterwave Webhooks

After the backend is live on Render, go to your Flutterwave Dashboard and set the Webhook URL to:
`https://your-app-name.onrender.com/api/webhooks/flutterwave`
Secret Hash: `dataplug_webhook_secret_hash` (or whatever you set in `render.yaml`)

## 🛠️ Tech Stack
- **Frontend**: React Native, Expo, Lucide Icons, Ionicons.
- **Backend**: Node.js, Express, Passport.js.
- **Database**: PostgreSQL (Neon), Drizzle ORM.
- **Payments**: Flutterwave (USSD, OPay, Bank Transfer).
- **Messaging**: Termii (OTP).

## 📄 License
Private/Proprietary
