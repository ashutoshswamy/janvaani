# JanVaani

Citizens raise development requests (water, roads, health, schools, electricity, sanitation) by voice or text, in their own language. Gemini transcribes, translates, categorises and scores urgency. Government officials see live requests for their area, update status, and publish announcements back to citizens.

- **Citizens**: sign in, raise a request (voice, text, photo, location), track its status, read announcements, get push notifications.
- **Officials (admin)**: live inbox for their state or district, status updates, internal notes, AI prioritisation, AI-drafted announcements.
- **Superadmin**: everything an admin can do, for all of India, plus assigning admins to areas.

Built with Next.js 16, Firebase (Auth, Firestore, Cloud Messaging), Gemini, Cloudinary and Leaflet/OpenStreetMap.

---

## 1. Requirements

| Tool | Version | Why |
|---|---|---|
| Node.js | **24 LTS** (23.6+ minimum) | The seed script runs `lib/mock-data.ts` directly; `--env-file` needs 20.6+ |
| npm | comes with Node | |
| Firebase CLI | latest (`npm i -g firebase-tools`) | Publishing Firestore security rules |
| A Google account | | Firebase + Gemini |
| A Cloudinary account | free tier is fine | Request photos |

---

## 2. One-time setup

Do these in order. Each step says where to click.

### 2.1 Install

```bash
git clone <this repo> janvaani
cd janvaani
npm install
cp .env.example .env.local
```

`.env.local` is git-ignored. **Never commit it and never put key files in `public/`** (everything in `public/` is downloadable by anyone).

### 2.2 Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (or open the existing one, e.g. `janvaani-app`).
2. **Project settings (gear) → General → Your apps → Add app → Web**. Copy the config values into `.env.local`:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   ```

   These are public by design; access is enforced by `firestore.rules` and server checks.

3. **Build → Firestore Database → Create database**
   - Edition: Standard. Location: **`asia-south1` (Mumbai)**. *The location can never be changed.*
   - Start in **production mode** (our rules replace the defaults in step 2.5).
   - Create it from the **console**: the CLI route requires a billing account.

4. **Build → Authentication → Get started → Sign-in method**: enable **Email/Password** and **Google**.
   When you deploy, also add your domain under **Authentication → Settings → Authorized domains** (`localhost` is already there).

5. **Project settings → Service accounts → Generate new private key**. A JSON file downloads. Put it in `.env.local` as **one line inside single quotes**:

   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}'
   ```

   Then delete the downloaded file. This key is full admin access to your project: never share it, never commit it.

6. **Project settings → Cloud Messaging → Web Push certificates → Generate key pair**. Copy the public key (starts with `B`, ~87 chars):

   ```env
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=B...
   ```

### 2.3 Gemini

[aistudio.google.com](https://aistudio.google.com) → **Get API key** → create key.

```env
GEMINI_API_KEY=...
```

Models used: `gemini-3.5-flash-lite` (analysis, translation, AI insights, drafting: `lib/gemini.ts`) and `gemini-3.5-transcribe` (voice to text: `app/api/transcribe/route.ts`). Recommended: in Google Cloud Console → Credentials, restrict the key to the *Generative Language API*.

### 2.4 Cloudinary

[console.cloudinary.com](https://console.cloudinary.com) → **Settings → API Keys**. The *API environment variable* looks like `cloudinary://<key>:<secret>@<cloud_name>`:

```env
CLOUDINARY_CLOUD_NAME=<cloud_name>   # the part after @, NOT the key's label (e.g. "Root")
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

Uploads are signed on the server; no upload preset is needed. Photos land in the `janvaani/requests` folder.

### 2.5 Publish the security rules

```bash
firebase login
firebase deploy --only firestore:rules --project <project-id>
```

Re-run this whenever `firestore.rules` changes. Without it, every page shows "Missing or insufficient permissions".

### 2.6 Create the first superadmin

1. **Authentication → Users → Add user**: your official email + a password.
2. Promote it:

   ```bash
   node --env-file=.env.local scripts/set-superadmin.mjs you@example.gov.in
   ```

3. Sign in at `/admin/login`. Other officials are added from **Admin → Officials** (see 4.6).

### 2.7 Optional: demo data

```bash
node --env-file=.env.local scripts/seed.mjs
```

Loads sample requests and announcements (safe to re-run; same IDs overwrite). Pages that show seed data display a "demo data" note, and seed announcements carry a **Demo** badge. Skip this for a real pilot.

---

## 3. Run it

```bash
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Check before shipping: `npx tsc --noEmit && npm run lint && npm run build`.

After editing `.env.local`, **restart** `npm run dev` if a change doesn't show up (`NEXT_PUBLIC_*` values are baked in when pages compile).

---

## 4. Using the system

### 4.1 Pages

| URL | Who | What |
|---|---|---|
| `/` | everyone | Landing page, language switch |
| `/login` | citizens | Sign up / sign in (email or Google), then set home state, district and village |
| `/citizen` | citizens | Home: raise a request, recent requests, enable notifications |
| `/citizen/submit` | citizens | Raise a request |
| `/citizen/requests` | citizens | Track own requests and their timeline |
| `/citizen/announcements` | citizens | All published announcements (push alerts only for their own area) |
| `/admin/login` | officials | Official sign-in (no self sign-up) |
| `/admin` | officials | Overview: live KPIs, map, hotspots, charts |
| `/admin/requests` | officials | Live inbox, filters, search, clustered view |
| `/admin/requests/[id]` | officials | Request detail, status update, notes |
| `/admin/ai` | officials | AI prioritisation, recommended projects, "Ask the data" |
| `/admin/announcements` | officials | Create and publish announcements |
| `/admin/officials` | superadmin | Assign / remove area admins |
| `/admin/settings` | officials | Placeholder switches (no effect yet) |

The citizen side is available in **English, हिन्दी and मराठी** (switcher in the header). Requests themselves can be written or spoken in **any** language; Gemini handles them. The admin console is English-only.

### 4.2 Citizen: raise a request

1. Sign in at `/login`. First time only: enter name, state, district and village.
2. **Raise a Request**. Either:
   - tap the **mic**, speak, tap again to stop: Gemini transcribes into the text box (edit it if needed), or
   - type in any language.
3. Optional: add a photo (image, max 10 MB) and tap **Use my location** for GPS (otherwise the village/district is geocoded for the map).
4. **Submit**. Gemini detects the language, category, urgency (1–5, with a reason), department and sentiment, writes summaries and an English translation. You get a reference like `JV-…`.
5. Track it under **My Requests**. Tap **Get notified about updates** on the home page to get a push when an official updates it.

### 4.3 Official: handle requests

1. Sign in at `/admin/login`. You only ever see requests in **your area** (enforced by Firestore rules and the server, not just the UI).
2. **Requests**: new submissions appear live, highlighted *NEW*. Filter by state, district, category, urgency, status, language; or switch to **Clustered** (same category + district).
3. Open a request:
   - read the original, the English translation, photo and map pin, and the AI analysis;
   - change **Status** (Submitted → Under Review → Action Planned → Resolved) and optionally write an **update for the citizen**: it goes to their timeline and as a push notification;
   - **Internal notes** are visible to officials of that area only;
   - **Link to Announcement** pre-fills an announcement with this request.

### 4.4 Official: AI Insights

- **Priority ranking**: district × category groups scored live on Demand, Urgency, Backlog and Waiting time. Drag the weight sliders to re-rank (resets on reload).
- **Recommended projects**: **Generate with AI** proposes up to 3 projects from your area's open requests; **Create Announcement** opens the form with those requests linked. The AI is told not to invent costs or beneficiary numbers.
- **Ask the data**: type a question ("Which district has most unresolved water requests?"). Answers use only your area's requests (newest 400).

### 4.5 Official: announcements

1. **Announcements** → pick districts (state/district admins are locked to their area), optional village, category.
2. Tick request groups to **link** them: their citizens are counted and notified.
3. Write notes on the action taken → **Draft with AI** (optional) → edit title and body.
4. **Translate to all languages** (Hindi, Marathi, Tamil) and review the tabs.
5. **Publish**: linked requests are tagged, subscribers in those districts get a push, every citizen sees it under Announcements.

### 4.6 Superadmin: officials

- **Admin → Officials → Assign admin**: the person must already have an account (**Authentication → Users → Add user**). Enter their email, a state, and optionally a district (empty = whole state).
- Role changes apply at their **next sign-in** (or within an hour). Removing an admin signs them out everywhere.
- Superadmins can't be changed from the UI; use `scripts/set-superadmin.mjs`.

---

## 5. Where data lives

| Store | What |
|---|---|
| Firestore `users/{uid}` | Citizen profile (name, email, state, district, village) |
| Firestore `requests/{id}` | Requests with AI analysis, status, timeline, masked contact, lat/lng, photo URL |
| Firestore `requestNotes/{id}` | Internal official notes |
| Firestore `announcements/{id}` | Published announcements (title/body in en/hi/mr) |
| Firestore `officials/{uid}` | Listing of officials (the real role lives in Firebase Auth custom claims) |
| Firestore `pushTokens/{sha256(token)}` | Devices registered for push (also subscribed to their state/district topics) |
| Cloudinary `janvaani/requests/` | Request photos |

All writes go through the server (`app/api/*`, Firebase Admin SDK). Browsers can only read what `firestore.rules` allows: citizens their own requests, officials their area.

---

## 6. Troubleshooting

| Symptom | Cause → fix |
|---|---|
| "Firebase is not configured" on sign-in pages | `NEXT_PUBLIC_FIREBASE_*` missing in `.env.local` → fill in, restart `npm run dev` |
| Console: `Database '(default)' not found` | Firestore not created → step 2.2.3 |
| `This API method requires billing to be enabled` | You tried creating Firestore via CLI → create it in the console instead |
| "Missing or insufficient permissions" / empty pages | Rules not published → step 2.5 |
| Official sign-in says "no official role" | Account not promoted → `set-superadmin.mjs` (first one) or Admin → Officials |
| New admin still sees old area / no access | Claims refresh on next sign-in → sign out and in again |
| Submit fails: "Submission failed" | Check the `npm run dev` terminal: `Gemini …` = bad `GEMINI_API_KEY`; `Cloudinary 401 cloud_name mismatch` = wrong `CLOUDINARY_CLOUD_NAME`; `FIREBASE_SERVICE_ACCOUNT is not set` = step 2.2.5 |
| Mic does nothing / "Microphone permission is needed" | Allow the microphone for the site. Mic and GPS need `https://` or `localhost` |
| "Couldn't transcribe" | Terminal shows `Gemini transcribe error` → check key / quota |
| No **Get notified about updates** button | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` missing, or the browser doesn't support push (iOS: add the site to the Home Screen first) |
| Notifications blocked | Re-allow in the browser's site settings |
| Request has no map pin | No GPS given and the place couldn't be geocoded (OpenStreetMap Nominatim). Harmless |
| `SyntaxError` running `seed.mjs` | Node too old → Node 23.6+ |
| `set-superadmin.mjs`: `user-not-found` | Create the user in Authentication → Users first; email must match exactly |
| Google sign-in popup closes with an error on a deployed site | Add the domain to Authentication → Settings → Authorized domains |

---

## 7. Deploying

Any Node host works (e.g. Vercel):

1. Set **every** variable from `.env.local` in the host's environment settings (keep `FIREBASE_SERVICE_ACCOUNT` as the one-line JSON).
2. Add the production domain to Firebase **Authorized domains**.
3. `firebase deploy --only firestore:rules --project <project-id>` if rules changed.
4. Serve over **HTTPS** (required for mic, GPS and push).

## 8. Security checklist

- `.env.local` and service-account JSON files never go in git or `public/`.
- If a key was ever pasted in chat, email or a public place, rotate it: Firebase service account (Service accounts → new key, delete the old one in Google Cloud IAM), Gemini key, Cloudinary secret (Settings → API Keys → regenerate).
- Only superadmins can assign roles; roles are Firebase custom claims, verified server-side on every admin API call.

## 9. Known limits (pilot)

- Admin console is English-only; citizen UI is en/hi/mr.
- **Settings** switches are placeholders.
- AI Insights reads the newest 400 requests per area; Overview loads the whole area in the browser. Fine for a pilot; move to server-side aggregates at ~10k requests per area.
- Geocoding uses the public Nominatim service (≤1 request/second policy); self-host or use a paid geocoder at scale.
