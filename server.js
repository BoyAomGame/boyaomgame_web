const express = require('express');
const path = require('path');
const session = require('express-session');


const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// IMPORTANT: Proxy MUST be registered BEFORE body-parsing middleware!
// express.json() consumes the raw request body stream. If it runs first,
// http-proxy-middleware receives an empty/drained stream for POST/PUT/DELETE,
// causing requests to hang forever and never reach the Python backend.
// ============================================================
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/api/userlooker', createProxyMiddleware({
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/userlooker': '',
    },
}));

// Middleware (AFTER proxy registration)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'parrot-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Serve ALL static files from 'root'. 
// Because the files are in `root/parrot/`, visiting `http://localhost:3000/parrot/` works automatically via this single command!
app.use(express.static(path.join(__dirname, 'root')));

// SPA Fallback for UserLooker React application
app.get(/^\/userlooker(?:\/.*)?$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'root', 'userlooker', 'index.html'));
});

// Import the modular API logic for the Parrot System
const parrotRouter = require('./website_sys/parrot_system/router');

// Mount the parrot router under the /api/parrot namespace
app.use('/api', parrotRouter);

app.listen(PORT, () => {
    console.log(`Server successfully started! \nOpen your browser and navigate to: http://localhost:${PORT}`);
});
