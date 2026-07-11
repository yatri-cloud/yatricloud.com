# Gmail Auto-Send Setup (Job Board Phase 4b)

Goal: on /jobs/applications, one click sends each application email **from the
user's own Gmail with the tailored resume PDF attached**, automatically, with
a daily cap so accounts are never flagged.

This needs the **Gmail API + OAuth** — the compose deep-link we ship today
cannot attach files or send without a manual click. Everything below is a
**one-time setup you (the owner) do in your Google account**; I cannot create
Google credentials for you. When it is done, hand back the two values in the
"What to send back" section and a build session wires the rest.

---

## Why it works this way (read once)

- `gmail.send` is a Google **restricted scope**. Google requires an app review
  before the general public can use it.
- **Before verification:** it works for up to **100 test users** you add by
  hand (you + your team), behind a one-time "Google hasn't verified this app"
  screen you click through. This is enough to pilot the feature.
- **For public launch:** submit the app for Google's security assessment
  (can take days to weeks). Plan for this before opening it to all Yatris.

---

## Part A — Google Cloud project + Gmail API (5 min)

1. Go to <https://console.cloud.google.com/> and sign in with the Google
   account that should own this (ideally a Yatri Cloud workspace account).
2. Top bar → project dropdown → **New Project**.
   - Name: `Yatri Cloud Jobs` → **Create** → select it.
3. Left menu → **APIs & Services → Library**.
4. Search **Gmail API** → open it → **Enable**.

---

## Part B — OAuth consent screen (10 min)

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** → **Create**.
3. App information:
   - App name: `Yatri Cloud`
   - User support email: your email
   - App logo (optional): the Yatri Cloud logo
   - Authorized domains: `yatricloud.com`
   - Developer contact email: your email → **Save and Continue**.
4. **Scopes** → **Add or Remove Scopes** → in the filter box paste:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
   Tick it → **Update** → **Save and Continue**.
   - Add nothing else. `gmail.send` can send mail but **cannot read** the
     inbox — smallest possible footprint, which also helps verification.
5. **Test users** → **Add Users** → add your own Gmail and any teammates who
   will pilot this (up to 100). → **Save and Continue** → **Back to Dashboard**.
6. Leave **Publishing status = Testing** for now. (Move to Production only
   after Google verification, when you want everyone to use it.)

---

## Part C — OAuth Client ID (5 min)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Name: `Yatri Cloud Jobs Web`.
4. **Authorized JavaScript origins** — add both:
   ```
   http://localhost:8080
   https://www.yatricloud.com
   ```
5. **Authorized redirect URIs** — add both (exact, no trailing slash):
   ```
   http://localhost:8080/jobs/applications
   https://www.yatricloud.com/jobs/applications
   ```
   (This is where Google returns the user after they grant permission. If the
   build session picks a different callback route, it will tell you to adjust
   this — it is a 10-second edit here.)
6. **Create**. A dialog shows your **Client ID** and **Client secret**.
   - **Client ID** looks like `xx…apps.googleusercontent.com` — safe to share.
   - **Client secret** looks like `GOCSPX-…` — **secret, never paste in chat.**

---

## Part D — Put the secret where it belongs (2 min)

The secret lives only on your Mac, in the git-ignored `.env`. In Terminal:

```bash
cd "/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub"
cat >> .env <<'EOF'
# Gmail send (job board outreach). Server-side only — NEVER VITE_ prefixed.
GMAIL_OAUTH_CLIENT_ID=paste_your_client_id_here
GMAIL_OAUTH_CLIENT_SECRET=paste_your_client_secret_here
EOF
```

- The **client ID** goes in `.env` here **and** you paste it back to me (it is
  public; the browser needs it to start the OAuth flow).
- The **client secret** stays in `.env` only. The Mac worker uses it to
  exchange the OAuth code for tokens — the browser never sees it.
- `.env` is git-ignored, so neither value is ever committed or shipped to the
  browser bundle. This is the same security rule as every other key in the
  project (never `VITE_` prefixed).

---

## What to send back

Paste **only the Client ID** into the next build session:

```
GMAIL_OAUTH_CLIENT_ID = xx…apps.googleusercontent.com
```

And confirm: **"secret is in .env, test user added."** That is everything the
build needs.

---

## What the build session will then create

- Migration: `gmail_accounts` (per-user OAuth tokens, owner-only RLS,
  refresh token encrypted) + a `send_status` / daily-count column on
  `job_applications`.
- **"Connect Gmail"** button on /jobs/applications → Google consent → back to
  the app with an auth code → the **Mac worker** exchanges it for tokens
  (using the secret) and stores them owner-scoped.
- **Send** and **Send all**: mark applications to send → the worker builds a
  MIME message with the tailored resume **PDF attached** and calls Gmail API
  `users.messages.send` as the user → marks sent.
- **Daily cap** (default ~25/user/day, configurable) + spacing between sends
  so Gmail never flags the account. Over-cap sends queue for the next day.
- Admin oversight in /admin/jobs of send volume.

---

## Honest limits to expect

- Until Google verifies the app, only your added **test users** can connect,
  and they see a one-time "unverified app" warning (click *Advanced →
  Continue*). Fine for a pilot, not for public launch.
- Gmail's own sending limits still apply (a free Gmail account is ~500
  recipients/day; Workspace ~2,000). Our cap sits well under these.
- This sends real email from a real account — the daily cap and manual
  test-user gating are the guardrails that keep it safe.
