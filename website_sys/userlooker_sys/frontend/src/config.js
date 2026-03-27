/**
 * Shared API configuration
 */

const getApiUrl = () => {
    // 1. Explicitly set environment variable takes precedence
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // 2. Local development fallback (direct to Python)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8001';
    }
    // 3. Production fallback - route through Node proxy
    return '/api/userlooker';
};

export const API_URL = getApiUrl();
