# Linkora — Architecture, Admin Access, Manual Payments & Netlify Deployment Guide

## 1. Admin Panel Access (`/admin`)
- **Primary Bootstrapped Admin Email**: `usman51225@gmail.com`
- **How to Open the Admin Panel**:
  1. Go to `/login` and sign in with **`usman51225@gmail.com`** using **Continue with Google** (or verified Email/Password).
  2. Once inside `/dashboard`, click **"Admin Console"** in the left sidebar (bottom section), or visit **`/admin`** directly in your browser.
- **Granting Additional Admins**:
  - Inside `/admin` → **Overview** → **Authorized Platform Administrators**, paste any user's Firebase Auth UID and verified email to grant or revoke admin access via `/admins/{uid}`.

## 2. Custom Manual Payment Methods & Manual Verification
- **Adding Custom Payment Methods (Admin)**:
  1. Open `/admin` → **Payments** tab → **Custom Manual Payment Methods**.
  2. Add any payment account you want (e.g., **JazzCash**, **EasyPaisa**, **SadaPay**, **Meezan Bank**, **Binance USDT**, **Wise**) with Account Title, Account Number / IBAN / Wallet, Display Order, and Payment Instructions.
  3. Toggle **Active** to show or hide methods immediately for users.
- **Submitting & Verifying Payments**:
  1. Users go to **Dashboard → Subscription & Upgrade**, pick an active payment method, copy the account number, transfer funds, and submit their **Sender Name**, **Sender Account/Phone**, **Transaction ID (Trx ID)**, and optional **Receipt Screenshot**.
  2. Admin opens `/admin` → **Payments** tab → **Manual Payment Verification Queue**, reviews the Transaction ID & receipt screenshot, optionally writes a note, and clicks **Approve & Activate Premium** (or **Reject**).
  3. Approving atomically updates `/paymentRequests/{id}`, `/users/{uid}.plan = 'premium'`, and `/subscriptions/{uid}`.

## 3. Deploying Linkora on Netlify (Step-by-Step)
This repository is pre-configured for Netlify via `/netlify.toml` and `/public/_redirects` so dynamic public URLs like `https://your-site.netlify.app/usman` and `/admin` work seamlessly on direct visits and page refreshes.

### Option A: Deploy via GitHub + Netlify (Recommended)
1. Push this project to a GitHub repository.
2. Log in to [Netlify](https://app.netlify.com/) → **Add new site** → **Import an existing project** → choose **GitHub** and select your repo.
3. Netlify automatically detects `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy site**.

### Option B: Manual Drag-and-Drop Deploy on Netlify
1. Run `npm install` and `npm run build` locally to generate the `dist/` folder.
2. Open [Netlify Drop / Sites](https://app.netlify.com/) and drag the `dist` folder to deploy.

### CRITICAL Step After Deploying to Netlify (Firebase Authorized Domains)
For **Google Sign-In** and **Firebase Auth** to work on your live Netlify URL (e.g., `your-linkora.netlify.app` or your custom domain `linkora.app`):
1. Open [Firebase Console](https://console.firebase.google.com/) → select project **`gen-lang-client-0957577346`**.
2. Go to **Authentication** → **Settings** tab → **Authorized domains**.
3. Click **Add domain** and add your Netlify domain (for example: `your-site-name.netlify.app` and/or your custom domain).
4. Optional (if using Email/Password login in addition to Google): under **Authentication → Sign-in method**, ensure **Email/Password** is enabled.

## 4. Firestore Collections & Security Rules (`/firestore.rules`)
- `/users/{userId}`: Isolated private account data (`plan`, `status`, `email`).
- `/admins/{adminUid}`: Trusted administrator registry.
- `/usernames/{username}` & `/profiles/{userId}` & `/profiles/{userId}/links/{linkId}`: Transactional slug index, bio page customization, and plan-enforced links.
- `/paymentMethods/{methodId}`: Custom manual payment accounts writable strictly by `isAdmin()` and readable when `isActive == true`.
- `/paymentRequests/{requestId}`: User payment verification submissions isolated strictly to `isOwner(uid) || isAdmin()`, with `status` transitions (`approved` / `rejected`) locked exclusively to `isAdmin()`.
- `/linkEvents/{eventId}`, `/analyticsDaily/{statId}`, `/subscriptions/{userId}`, `/supportTickets/{ticketId}`, `/reports/{reportId}`, `/platformSettings/{docId}`, `/faqs/{faqId}`.
