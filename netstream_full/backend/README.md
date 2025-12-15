# NetStream Backend
1. Install dependencies:
   npm install
2. Set TMDb key in server.js
3. Run backend:
   node server.js
4. Endpoints:
   - /api/trending
   - /api/search?q=...
   - /api/details/:type/:id
   - /api/videos/:type/:id
   - /api/auth/signup
   - /api/auth/login
   - /api/watchlist (GET/POST, auth required)
   - /api/play/:type/:id/:season?/:episode?
