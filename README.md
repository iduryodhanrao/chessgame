# Pocket Chess

Pocket Chess is a mobile-first chess game built with Next.js and TypeScript.

## Features
- Beautiful phone-sized UI with a centered 8x8 board
- Two modes:
  - **Play vs Computer**
  - **Pass & Play with Friend**
- Legal move handling for all pieces
- Castling, en passant, and pawn promotion
- Check, checkmate, and stalemate detection
- Captured-piece tracking and move summaries
- In-app prompts for game start, restart, promotion, and handoff
- Installable as a **Progressive Web App (PWA)** on Android

## Required prompts included
- Choose mode: **Play vs Computer** or **Pass & Play**
- Start a new game
- Restart current game
- Promote pawn to **Queen**, **Rook**, **Bishop**, or **Knight**
- Turn, check, and game-over status messaging
- Pass-the-phone handoff prompt in pass-and-play mode

## Project phases
1. **Project setup** - scaffold the Next.js app and mobile shell.
2. **Chess engine** - implement board state, legal moves, captures, special moves, and game-end logic.
3. **Mobile UI** - build the board, cards, prompts, and controls for narrow screens.
4. **Gameplay flows** - wire computer turns, pass-and-play handoff, promotion, and restart behavior.
5. **Validation** - lint and production build the project.

## Run locally
1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Open `http://localhost:3000`

## Install on Android as a PWA
1. Deploy the app to an **HTTPS** host such as Vercel.
2. Open the deployed URL in **Chrome on Android**.
3. Tap the browser menu and choose **Add to Home screen** or **Install app**.
4. Launch Pocket Chess from the home screen like a normal app.

### PWA support included
- Web app manifest
- App icons (`192x192`, `512x512`, Apple touch icon)
- Service worker for installability and offline caching of the app shell
- Standalone display mode for app-like launch behavior

## Build checks
- Lint: `npm run lint`
- Production build: `npm run build`
- Production start: `npm run start`

## Deploy to GitHub and Railway

### 1. Create a GitHub repository
Create an empty repository on GitHub for this project, then copy its HTTPS URL.

### 2. Push this project from your machine
Run these commands in `C:\Users\Indugu Rao\myrepos\mobile-chess`:

```powershell
git init
git add .
git commit -m "Initial Pocket Chess app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Deploy from Railway
Because this app is a Next.js app, Railway should deploy it using the included standalone output.

#### Railway dashboard flow
1. Go to `https://railway.com/new`
2. Choose **Deploy from GitHub repo**
3. Select your new repository
4. After deploy finishes, open the service **Networking** settings
5. Generate a public domain

#### Railway CLI flow
If you prefer the CLI, first re-authenticate:

```powershell
railway login
railway link
railway up
```

### 4. Install as an Android PWA
Once Railway gives you an HTTPS URL:
1. Open the URL in **Chrome on Android**
2. Tap **Add to Home screen** or **Install app**
3. Launch Pocket Chess from the home screen

## Tech
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- lucide-react icons
