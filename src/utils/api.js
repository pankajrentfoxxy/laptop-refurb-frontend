import axios from 'axios';

// API Configuration - Production: set REACT_APP_API_URL in Vercel (e.g. https://your-backend.railway.app/api)
const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host.startsWith('192.168.')) {
        return `http://${host}:5001/api`;
    }
    return process.env.NODE_ENV === 'production'
        ? (process.env.REACT_APP_API_URL || '')
        : `http://localhost:5001/api`;
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
