# Deploy Traitors — GitHub + Vercel (detailed guide)

**Important:** Vercel can host the **website** (`client/`). It **cannot** host the **game server** (`server/`) because Socket.io needs a process that stays running 24/7. You will use:

| Part | Host | Folder |
|------|------|--------|
| Frontend (Next.js) | **Vercel** | `client/` |
| Backend (Socket.io) | **Railway** (free tier) | `server/` |

Both connect through **GitHub** (push code once, Vercel + Railway auto-deploy on push).

---

## What you need before starting

- [ ] GitHub account — https://github.com/signup
- [ ] Vercel account — https://vercel.com/signup (use “Continue with GitHub”)
- [ ] Railway account — https://railway.app (use “Login with GitHub”)
- [ ] Git on your PC — https://git-scm.com/download/win
- [ ] Node.js 18+ — https://nodejs.org
- [ ] Your Traitors project at `C:\Users\DELL\OneDrive\Desktop\traitor`

---

# PART 1 — Put your code on GitHub

## Step 1.1 — Open PowerShell in your project folder

1. Press `Win + E`, go to `Desktop\traitor`
2. Click the address bar, type `powershell`, press Enter  
   **OR** in Cursor: Terminal → New Terminal (should already be in the project)

## Step 1.2 — Check Git is installed

```powershell
git --version
```

You should see something like `git version 2.x.x`. If not, install Git from the link above and restart PowerShell.

## Step 1.3 — Initialize Git (only if this folder is NOT already a repo)

```powershell
cd C:\Users\DELL\OneDrive\Desktop\traitor
git status
```

- If you see `fatal: not a git repository`, run:

```powershell
git init
git branch -M main
```

- If you already see branch `main` and file lists, skip `git init`.

## Step 1.4 — Create `.gitignore` (already in project)

Your repo should **not** upload secrets or `node_modules`. The project already has `.gitignore` with:

- `node_modules/`
- `.env`, `.env.local`
- `.next/`, `dist/`

**Do not commit** `server/.env` or `client/.env.local` (they stay on your PC only).

## Step 1.5 — Stage and commit all files

```powershell
git add .
git status
```

Review the list — you should **not** see `node_modules` or `.env.local`.

```powershell
git commit -m "Initial commit: Traitors multiplayer game"
```

If Git asks for name/email the first time:

```powershell
git config user.email "you@example.com"
git config user.name "Your Name"
```

Then run `git commit` again.

## Step 1.6 — Create an empty repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `traitors` (or any name you like)
3. **Public** or **Private** — your choice
4. **Do NOT** check “Add a README” (you already have code)
5. Click **Create repository**

## Step 1.7 — Connect local folder to GitHub and push

GitHub shows commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/traitors.git
git push -u origin main
```

- Browser may open for GitHub login
- If asked for password, use a **Personal Access Token**, not your GitHub password:  
  https://github.com/settings/tokens → Generate new token (classic) → scope `repo`

## Step 1.8 — Verify on GitHub

Refresh your repo page. You should see:

```
client/
server/
README.md
package.json
...
```

---

# PART 2 — Deploy the game server on Railway

Railway runs `server/` so players can connect via WebSockets.

## Step 2.1 — New Railway project

1. Go to https://railway.app/dashboard
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Authorize Railway to access GitHub if prompted
5. Select your `traitors` repository

## Step 2.2 — Tell Railway to use the `server` folder

Railway might try to deploy the whole repo. Fix the root directory:

1. Click the service (purple box) that was created
2. Open **Settings** tab
3. Find **Root Directory** (or **Source** → Root Directory)
4. Set it to: `server`
5. Save

## Step 2.3 — Build and start commands

Still in **Settings**, confirm (Railway often auto-detects Node):

| Setting | Value |
|---------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

If there is a **Watch Paths** option, you can set `/server/**` so only server changes redeploy.

## Step 2.4 — Environment variables (temporary)

1. Open the **Variables** tab
2. Add:

| Variable | Value (for now) |
|----------|------------------|
| `CLIENT_URL` | `http://localhost:3000` |

You will **change** `CLIENT_URL` after Vercel gives you the real URL.

Railway sets `PORT` automatically — do not add `PORT` yourself.

## Step 2.5 — Generate a public URL

1. Open **Settings** → **Networking** (or click **Generate Domain**)
2. Click **Generate Domain**
3. Copy the URL, e.g. `https://traitors-production-a1b2.up.railway.app`

**Save this URL** — you need it for Vercel as `NEXT_PUBLIC_SERVER_URL`.

## Step 2.6 — Wait for deploy to succeed

1. Open **Deployments** tab
2. Latest deployment should show **Success** / green
3. Optional test in browser:  
   `https://YOUR-RAILWAY-URL.up.railway.app/health`  
   Should show: `{"ok":true}`

If build fails, open **View logs** and check for missing `npm run build` or TypeScript errors.

---

# PART 3 — Deploy the frontend on Vercel

## Step 3.1 — Import project

1. Go to https://vercel.com/dashboard
2. Click **Add New…** → **Project**
3. **Import** your GitHub `traitors` repo
4. If GitHub is not connected, click **Install** and allow Vercel access to your repo

## Step 3.2 — Configure the project (critical)

On the **Configure Project** screen, set:

| Field | Value |
|-------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | Click **Edit** → select or type `client` |
| **Build Command** | (leave default) `next build` |
| **Output Directory** | (leave default) |
| **Install Command** | (leave default) `npm install` |

**Root Directory must be `client`** — not the repo root.

## Step 3.3 — Environment variables on Vercel

Expand **Environment Variables** and add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SERVER_URL` | Your Railway URL from Step 2.5 |

Example:

```
https://traitors-production-a1b2.up.railway.app
```

Rules:

- Use `https://`
- **No** trailing slash `/` at the end
- Must match Railway’s public domain exactly

Apply to: **Production**, **Preview**, and **Development** (check all three).

## Step 3.4 — Deploy

1. Click **Deploy**
2. Wait 1–3 minutes
3. Vercel shows **Congratulations** and a URL like `https://traitors-xyz.vercel.app`

**Copy your Vercel URL** — you need it for Railway CORS.

## Step 3.5 — Test the site loads

Open the Vercel URL. You should see the dark **TRAITORS** landing page.

The game may **not** connect yet until you fix `CLIENT_URL` on Railway (next part).

---

# PART 4 — Connect frontend and backend

## Step 4.1 — Update Railway `CLIENT_URL`

1. Railway dashboard → your service → **Variables**
2. Edit `CLIENT_URL` to your **exact** Vercel URL:

```
https://traitors-xyz.vercel.app
```

- Same scheme (`https`)
- No trailing slash
- No `/room` path — only the origin

3. Save — Railway will **redeploy** automatically

## Step 4.2 — Redeploy Vercel (if you changed server URL earlier)

If you already set `NEXT_PUBLIC_SERVER_URL` correctly before first deploy, skip this.

If you fix the Railway URL later:

1. Vercel → your project → **Deployments**
2. Click **⋯** on latest → **Redeploy**

`NEXT_PUBLIC_*` variables are baked in at **build** time, so any change requires a redeploy.

## Step 4.3 — Full connection test

1. Open `https://your-app.vercel.app`
2. Press `F12` → **Network** tab → filter **WS** (WebSocket)
3. Click **Create Room**, enter a nickname
4. You should see a WebSocket connection to your **Railway** host (not vercel.app)
5. Status should stay connected (not endless “Reconnecting…”)

Create room on one tab, join with code on another tab (or phone on mobile data).

---

# PART 5 — Automatic deploys from GitHub

After setup, every `git push` to `main` can redeploy both:

| Host | What redeploys |
|------|----------------|
| Vercel | Changes under `client/` |
| Railway | Changes under `server/` (if root is `server`) |

Workflow:

```powershell
cd C:\Users\DELL\OneDrive\Desktop\traitor
# edit files...
git add .
git commit -m "Describe your change"
git push
```

Watch Vercel and Railway dashboards for new deployments.

---

# PART 6 — Troubleshooting

## “Reconnecting…” / can’t create room

| Check | Fix |
|-------|-----|
| Wrong API URL | Vercel env `NEXT_PUBLIC_SERVER_URL` = Railway HTTPS URL |
| CORS | Railway `CLIENT_URL` = exact Vercel URL |
| Forgot redeploy | Redeploy **both** after env changes (Vercel required for `NEXT_PUBLIC_*`) |
| Railway asleep | Free tier may sleep; open Railway URL `/health` to wake, retry |

## WebSocket fails but site loads

- Open Railway logs while you click Create Room
- Confirm `/health` works in browser
- Try incognito (browser extensions sometimes block WS)

## Build fails on Vercel

- **Root Directory** must be `client`
- Build logs: missing dependency → run `npm install` locally in `client/` and commit `package-lock.json`

## Build fails on Railway

- **Root Directory** must be `server`
- Logs should show `tsc` then `node dist/index.js`

## PowerShell: `npm` blocked

Use:

```powershell
npm.cmd run build
```

instead of `npm run build`.

## CORS error in browser console

```
Access-Control-Allow-Origin
```

`CLIENT_URL` on Railway does not match the page origin. Copy the URL from the browser address bar (Vercel), paste into Railway `CLIENT_URL`, redeploy.

---

# PART 7 — Custom domain (optional)

## Vercel (e.g. `traitors.yourdomain.com`)

1. Vercel → Project → **Settings** → **Domains**
2. Add domain, follow DNS instructions (CNAME to `cname.vercel-dns.com`)

## Railway (e.g. `api.yourdomain.com`)

1. Railway → **Settings** → **Networking** → **Custom Domain**
2. Add CNAME pointing to Railway’s target

Then update env vars:

- Vercel: `NEXT_PUBLIC_SERVER_URL=https://api.yourdomain.com`
- Railway: `CLIENT_URL=https://traitors.yourdomain.com`

Redeploy both.

---

# Quick reference — env vars

```
# Railway (server)
CLIENT_URL=https://your-project.vercel.app
PORT=(automatic)

# Vercel (client)
NEXT_PUBLIC_SERVER_URL=https://your-project.up.railway.app
```

---

# Checklist

- [ ] Code pushed to GitHub
- [ ] Railway: root = `server`, deploy green, `/health` works
- [ ] Vercel: root = `client`, deploy green, landing page loads
- [ ] `NEXT_PUBLIC_SERVER_URL` on Vercel = Railway URL
- [ ] `CLIENT_URL` on Railway = Vercel URL
- [ ] Vercel redeployed after env setup
- [ ] WebSocket connects in DevTools
- [ ] 4 players can join and host can start game

You’re live.
