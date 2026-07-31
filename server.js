const express = require('express');
const path = require('path');
const session = require('express-session');


const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIRECTORY = path.join(__dirname, 'root');
const PARROT_DIRECTORY = path.join(ROOT_DIRECTORY, 'parrot');
const serveParrot = express.static(PARROT_DIRECTORY);

/**
 * Treat `parrot.<domain>` as the Parrot site. PARROT_HOSTS can be used for
 * domains that do not follow that convention (comma-separated, without ports).
 */
function isParrotHostname(hostname) {
    const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
    const configuredHosts = (process.env.PARROT_HOSTS || '')
        .split(',')
        .map(host => host.trim().toLowerCase().replace(/\.$/, ''))
        .filter(Boolean);

    return normalizedHostname === 'parrot.localhost'
        || normalizedHostname.startsWith('parrot.')
        || configuredHosts.includes(normalizedHostname);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'parrot-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// On a Parrot subdomain, expose root/parrot as the site's document root.
// Keep the original /parrot/ URL working on the primary domain.
app.use((req, res, next) => {
    if (!isParrotHostname(req.hostname)) {
        return next();
    }

    return serveParrot(req, res, next);
});
app.use(express.static(ROOT_DIRECTORY));

// Import the modular API logic for the Parrot System
const parrotRouter = require('./website_sys/parrot_system/router');

// Mount the parrot router under the /api/parrot namespace
app.use('/api', parrotRouter);

app.listen(PORT, () => {
    console.log(`Server successfully started! \nOpen your browser and navigate to: http://localhost:${PORT}`);
});

module.exports = { app, isParrotHostname };
