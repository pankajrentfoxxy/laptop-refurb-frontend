import axios from 'axios';

// API Configuration
const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    const host = window.location.hostname;

    // If running locally (localhost or IP)
    if (host === 'localhost' || host.startsWith('192.168.')) {
        return `http://${host}:5001/api`;
    }

    // If running on localtunnel (public)
    if (host.includes('loca.lt')) {
        return 'https://sour-bugs-grab.loca.lt/api';
    }

    // Fallback
    return 'http://localhost:5001/api';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
