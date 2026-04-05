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

// Next.js UserLooker UI (basePath /userlooker). Proxies to the Next process; without this,
// /userlooker on this server 404s (legacy static bundle has no index.html).
// Set USERLOOKER_NEXT_URL=http://127.0.0.1:PORT to override; set USERLOOKER_NEXT_URL= (empty) to use static SPA only.
const explicitNext = process.env.USERLOOKER_NEXT_URL;
let userlookerNextUrl = null;
if (explicitNext !== undefined && String(explicitNext).trim() === '') {
    userlookerNextUrl = null;
} else {
    userlookerNextUrl =
        (explicitNext && String(explicitNext).trim()) ||
        (process.env.NODE_ENV === 'production'
            ? 'http://127.0.0.1:8001'
            : 'http://127.0.0.1:3001');
}

if (userlookerNextUrl) {
    try {
        const upstream = new URL(userlookerNextUrl);
        const upstreamPort = upstream.port
            ? Number(upstream.port)
            : upstream.protocol === 'https:'
              ? 443
              : 80;
        const listenPort = Number(PORT);
        if (
            (upstream.hostname === 'localhost' || upstream.hostname === '127.0.0.1') &&
            upstreamPort === listenPort
        ) {
            console.error(
                '[userlooker] USERLOOKER_NEXT_URL must not use the same port as this server (infinite proxy loop).',
                'Use the Next.js port (e.g. 8001), not',
                listenPort,
            );
            userlookerNextUrl = null;
        }
    } catch (e) {
        console.error('[userlooker] Invalid USERLOOKER_NEXT_URL:', e);
        userlookerNextUrl = null;
    }
}

if (userlookerNextUrl) {
    app.use(
        createProxyMiddleware({
            target: userlookerNextUrl,
            pathFilter: '/userlooker',
            changeOrigin: true,
            xfwd: true,
            onProxyReq(proxyReq, req) {
                const host = req.headers.host;
                if (host) {
                    proxyReq.setHeader('X-Forwarded-Host', host);
                }
                proxyReq.setHeader('X-Forwarded-Proto', 'http');
            },
        }),
    );
}

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

// Legacy static UserLooker SPA (only when Next proxy is off)
if (!userlookerNextUrl) {
    app.get(/^\/userlooker(?:\/.*)?$/, (req, res) => {
        res.sendFile(path.join(__dirname, 'root', 'userlooker', 'index.html'));
    });
}

// Import the modular API logic for the Parrot System
const parrotRouter = require('./website_sys/parrot_system/router');

// Mount the parrot router under the /api/parrot namespace
app.use('/api', parrotRouter);

app.listen(PORT, () => {
    console.log(`Server successfully started! \nOpen your browser and navigate to: http://localhost:${PORT}`);
});
