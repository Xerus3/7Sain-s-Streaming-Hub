# NetStream Full Version

## Features
- Netflix-style UI with animations
- TMDb catalog, search, details, trailers
- Small user account system (signup/login, JWT auth)
- Watchlist and Continue Watching per user
- TV seasons & episode selector UI
- Generic video player placeholder (iframe / HTML5)
- Fully frontend + backend project
- Deployment guide included

## Backend Setup
1. cd backend
2. npm install
3. Set your TMDb API key in server.js
4. node server.js
5. Backend runs on http://localhost:3000

## Frontend Setup
1. Open frontend/index.html in a browser (or serve with static server)
2. Frontend communicates with backend endpoints

## Auth Endpoints
- POST /api/auth/signup {username,email,password}
- POST /api/auth/login {email,password}
- Protected: /api/watchlist (GET/POST)

## Watchlist & Continue Watching
- Add items to watchlist via POST /api/watchlist
- Continue Watching items auto-update timestamps
- Auth required

## Video Player
- /api/play/:type/:id/:season?/:episode? endpoint
- Returns { mode: "none" } placeholder
- Frontend uses iframe / HTML5 / fallback

## Deployment
- Use Railway / Vercel for backend/frontend
- Set environment variables for TMDb key and JWT_SECRET
- Serve frontend as static files or deploy via Netlify/Vercel
