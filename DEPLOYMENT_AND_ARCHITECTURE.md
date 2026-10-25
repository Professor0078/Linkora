# Linkora 3.0 — Architecture, Light/Dark Theme System, Admin Access & GitHub → Netlify Update Guide

## 1. What’s New in Linkora 3.0
- **App-Wide Light & Dark Theme System**:
  - Synchronized global **Light / Dark** toggle across the Landing Page, Login/Signup, Creator Dashboard, Admin Console, Legal/Support pages, and Not-Found pages (`localStorage` key `linkora_color_mode` with OS `prefers-color-scheme` fallback).
  - **Visitor Light/Dark Surface Switcher**: Creators can enable `visitorThemeSwitchEnabled` so visitors on `/:username` can switch the bio page between Light and Dark reading surfaces on the fly without altering the creator's saved defaults.
- **16 Curated Built-In Themes (9 Free + 7 Premium)**:
  - Added balanced Light & Dark palettes: Free **Nordic Frost** & **Carbon Slate**, plus Premium **Emerald Luxe** & **Cyber Aurora**, with Light/Dark/Free/Premium filtering in both the Landing Gallery and Dashboard Theme Picker.
- **Scheduled Links, Pinned Links, Bulk Actions & Inline Media Embeds**:
  - **Scheduled Drops**: Optional `startsAt` and `expiresAt` (`datetime-local`) windows automatically reveal or retire links on public bio pages while displaying `Live`, `Scheduled`, or `Expired` status in **Manage Links**.
  - **Pinned Links & Bulk Operations**: Pin priority links to the top of your page and enable or hide all links in one click.
  - **Safe Inline YouTube & Spotify Players**: Links with `embedType` set to `youtube` or `spotify` render privacy-enhanced expandable `youtube-nocookie.com/embed/...` or `open.spotify.com/embed/...` drawers right inside the bio page.
- **Creator Availability Status, Tip Jar & Automatic Link Search**:
  - **Availability Status**: Show clear booking status (`Available`, `Busy / Limited`, `Away`) + custom note on your profile header.
  - **Creator Tip Jar / Support Card**: Dedicated support card for Buy Me a Coffee, Ko-fi, PayPal, Stripe, or custom tip links.
  - **Visitor Link Search**: Automatically appears on public bio pages with 6+ active links.
- **QR & Share Studio 3.0 + Workspace Productivity**:
  - Custom QR ink color swatches, high-resolution downloadable **720×920 Branded Share Card PNG**, direct social share links, and copyable **HTML Website Badge** embed code.
  - **Quick Command Palette (`Ctrl+K` / `Cmd+K`)** and **Profile Conversion Readiness Checklist** inside the Creator Dashboard.

---

## 2. How to Update Your Live Site to 3.0 (GitHub → Netlify Continuous Deployment)

Because your GitHub repository is already linked to Netlify, pushing the Linkora 3.0 code to the **same GitHub repository** automatically triggers a new Netlify production build (`npm run build` → `dist/`). All existing Firebase users, links, leads, and manual payment methods remain completely intact.

### Option A: Push via Git CLI (Recommended)
```bash
git add .
git commit -m "Upgrade to Linkora 3.0 with Light/Dark mode and media embeds"
git push origin main
```
*(Use `git push origin master` if your repository's default branch is `master`.)*

### Option B: Upload via GitHub Web UI
1. Export/download the updated project files from AI Studio.
2. Open your repository on **GitHub.com** → **Add file → Upload files**.
3. Drag and drop the updated project files (`src/`, `index.html`, `package.json`, `firestore.rules`, `firebase-blueprint.json`, etc.) and commit to `main`.
4. Netlify will automatically build and publish Linkora 3.0 in ~1–2 minutes.

---

## 3. Admin Panel Access (`/admin`) & Manual Payments
- **Bootstrapped Admin Email**: `usman51225@gmail.com`
- **Access**: Sign in at `/login` with `usman51225@gmail.com` and open **Admin Console** (`/admin`).
- **Manual Payment Methods & Verification**:
  - Configure custom payment accounts (EasyPaisa, JazzCash, SadaPay, Bank IBAN, Binance USDT, Wise) in `/admin` → **Payments**.
  - Review submitted Transaction IDs and receipts in the **Manual Payment Verification Queue** to approve or reject Premium upgrades.
- **Security Note**: Before sharing your live app broadly, review `firestore.rules` in the Firebase Console and verify your Netlify domain is listed under **Firebase Console → Authentication → Settings → Authorized domains**.
